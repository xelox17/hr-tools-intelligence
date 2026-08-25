import { AxiosInstance, AxiosRequestConfig } from 'axios';
import DatabaseManager from '@/lib/database';
import { createHttpClient, requestWithRetry } from './http';

interface KelioTimesheetRecord {
  id: string;
  employeeEmail?: string;
  kelioId?: string;
  date?: string;
  hoursWorked?: number;
}

interface KelioPunchRecord {
  id: string;
  employeeEmail?: string;
  kelioId?: string;
  timestamp?: string;
  type?: string;
}

interface KelioTimesheetsResponse {
  timesheets: KelioTimesheetRecord[];
}

interface KelioPunchRecordsResponse {
  punchRecords: KelioPunchRecord[];
}

export interface KelioSyncResult {
  success: boolean;
  timesheetsSynced: number;
  timeSheetsFailed: number;
  errors: string[];
}

type KelioEmployeeLink = { employeeEmail?: string; kelioId?: string };

export class KelioAPI {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.KELIO_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [KelioAPI] KELIO_API_KEY is not set');
    }

    this.client = createHttpClient('https://api.kelio.com/v1', {
      'x-api-key': apiKey ?? '',
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    return requestWithRetry<T>(this.client, config, 'KelioAPI');
  }

  private async fetchTimesheets(): Promise<KelioTimesheetRecord[]> {
    const data = await this.request<KelioTimesheetsResponse>({
      method: 'GET',
      url: '/timesheets',
    });
    return data.timesheets ?? [];
  }

  private async fetchPunchRecords(): Promise<KelioPunchRecord[]> {
    const data = await this.request<KelioPunchRecordsResponse>({
      method: 'GET',
      url: '/punch-records',
    });
    return data.punchRecords ?? [];
  }

  private validateLink(record: KelioEmployeeLink): boolean {
    return Boolean(record.employeeEmail && record.kelioId);
  }

  async syncTimesheets(): Promise<KelioSyncResult> {
    const errors: string[] = [];
    let timesheetsSynced = 0;
    let timeSheetsFailed = 0;

    let timesheets: KelioTimesheetRecord[];
    let punchRecords: KelioPunchRecord[];
    try {
      [timesheets, punchRecords] = await Promise.all([
        this.fetchTimesheets(),
        this.fetchPunchRecords(),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [KelioAPI] Failed to fetch timesheets/punch records: ${message}`);
      return { success: false, timesheetsSynced: 0, timeSheetsFailed: 0, errors: [message] };
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const records: KelioEmployeeLink[] = [...timesheets, ...punchRecords];

    for (const record of records) {
      if (!this.validateLink(record)) {
        timeSheetsFailed++;
        errors.push(`Invalid timesheet/punch record: ${JSON.stringify(record)}`);
        console.error(`❌ [KelioAPI] Invalid timesheet/punch record: ${JSON.stringify(record)}`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO employees (email, kelio_id, synced_from, updated_at)
           VALUES ($1, $2, ARRAY['kelio'], NOW())
           ON CONFLICT (email) DO UPDATE SET
             kelio_id = EXCLUDED.kelio_id,
             synced_from = CASE
               WHEN 'kelio' = ANY(employees.synced_from) THEN employees.synced_from
               ELSE array_append(employees.synced_from, 'kelio')
             END,
             updated_at = NOW()`,
          [record.employeeEmail, record.kelioId]
        );
        timesheetsSynced++;
        console.log(`✅ [KelioAPI] Synced record for ${record.employeeEmail}`);
      } catch (error) {
        timeSheetsFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync record for ${record.employeeEmail}: ${message}`);
        console.error(`❌ [KelioAPI] Failed to sync record for ${record.employeeEmail}: ${message}`);
      }
    }

    return { success: timeSheetsFailed === 0, timesheetsSynced, timeSheetsFailed, errors };
  }
}
