import { AxiosInstance, AxiosRequestConfig } from 'axios';
import DatabaseManager from '@/lib/database';
import { createHttpClient, requestWithRetry } from './http';

interface CornerstoneUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface CornerstoneUsersResponse {
  users: CornerstoneUser[];
}

export interface CornerstoneSyncResult {
  success: boolean;
  userssynced: number;
  usersFailed: number;
  errors: string[];
}

export class CornerStoneAPI {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.CORNERSTONE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [CornerStoneAPI] CORNERSTONE_API_KEY is not set');
    }

    this.client = createHttpClient('https://api.cornerstone.com/v1', {
      Authorization: `Bearer ${apiKey ?? ''}`,
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    return requestWithRetry<T>(this.client, config, 'CornerStoneAPI');
  }

  private validateUser(user: CornerstoneUser): boolean {
    return Boolean(user.id && user.email);
  }

  async syncUsers(): Promise<CornerstoneSyncResult> {
    const errors: string[] = [];
    let userssynced = 0;
    let usersFailed = 0;

    let users: CornerstoneUser[];
    try {
      const data = await this.request<CornerstoneUsersResponse>({
        method: 'GET',
        url: '/users',
      });
      users = data.users ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [CornerStoneAPI] Failed to fetch users: ${message}`);
      return { success: false, userssynced: 0, usersFailed: 0, errors: [message] };
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    for (const user of users) {
      if (!this.validateUser(user)) {
        usersFailed++;
        errors.push(`Invalid user record: ${JSON.stringify(user)}`);
        console.error(`❌ [CornerStoneAPI] Invalid user record: ${JSON.stringify(user)}`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO employees (first_name, last_name, email, cornerstone_id, synced_from, updated_at)
           VALUES ($1, $2, $3, $4, ARRAY['cornerstone'], NOW())
           ON CONFLICT (email) DO UPDATE SET
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             cornerstone_id = EXCLUDED.cornerstone_id,
             synced_from = CASE
               WHEN 'cornerstone' = ANY(employees.synced_from) THEN employees.synced_from
               ELSE array_append(employees.synced_from, 'cornerstone')
             END,
             updated_at = NOW()`,
          [user.firstName ?? null, user.lastName ?? null, user.email, user.id]
        );
        userssynced++;
        console.log(`✅ [CornerStoneAPI] Synced user ${user.email}`);
      } catch (error) {
        usersFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync user ${user.email}: ${message}`);
        console.error(`❌ [CornerStoneAPI] Failed to sync user ${user.email}: ${message}`);
      }
    }

    return { success: usersFailed === 0, userssynced, usersFailed, errors };
  }
}
