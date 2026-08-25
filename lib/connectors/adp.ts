import { AxiosInstance, AxiosRequestConfig } from 'axios';
import DatabaseManager from '@/lib/database';
import { createHttpClient, requestWithRetry } from './http';

interface ADPEmployee {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  hireDate?: string;
  department?: string;
}

interface ADPEmployeesResponse {
  employees: ADPEmployee[];
}

export interface ADPSyncResult {
  success: boolean;
  employeesSynced: number;
  employeesFailed: number;
  errors: string[];
}

export class ADPApi {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.ADP_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [ADPApi] ADP_API_KEY is not set');
    }

    this.client = createHttpClient('https://api.adp.fr/v1', {
      'x-api-key': apiKey ?? '',
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    return requestWithRetry<T>(this.client, config, 'ADPApi');
  }

  private validateEmployee(employee: ADPEmployee): boolean {
    return Boolean(employee.id && employee.email);
  }

  async syncEmployees(): Promise<ADPSyncResult> {
    const errors: string[] = [];
    let employeesSynced = 0;
    let employeesFailed = 0;

    let employees: ADPEmployee[];
    try {
      const data = await this.request<ADPEmployeesResponse>({
        method: 'GET',
        url: '/employees',
      });
      employees = data.employees ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [ADPApi] Failed to fetch employees: ${message}`);
      return { success: false, employeesSynced: 0, employeesFailed: 0, errors: [message] };
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    for (const employee of employees) {
      if (!this.validateEmployee(employee)) {
        employeesFailed++;
        errors.push(`Invalid employee record: ${JSON.stringify(employee)}`);
        console.error(`❌ [ADPApi] Invalid employee record: ${JSON.stringify(employee)}`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO employees (first_name, last_name, email, hire_date, department, adp_id, synced_from, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, ARRAY['adp'], NOW())
           ON CONFLICT (email) DO UPDATE SET
             hire_date = EXCLUDED.hire_date,
             department = EXCLUDED.department,
             adp_id = EXCLUDED.adp_id,
             synced_from = CASE
               WHEN 'adp' = ANY(employees.synced_from) THEN employees.synced_from
               ELSE array_append(employees.synced_from, 'adp')
             END,
             updated_at = NOW()`,
          [
            employee.firstName ?? null,
            employee.lastName ?? null,
            employee.email,
            employee.hireDate ?? null,
            employee.department ?? null,
            employee.id,
          ]
        );
        employeesSynced++;
        console.log(`✅ [ADPApi] Synced employee ${employee.email}`);
      } catch (error) {
        employeesFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync employee ${employee.email}: ${message}`);
        console.error(`❌ [ADPApi] Failed to sync employee ${employee.email}: ${message}`);
      }
    }

    return { success: employeesFailed === 0, employeesSynced, employeesFailed, errors };
  }
}
