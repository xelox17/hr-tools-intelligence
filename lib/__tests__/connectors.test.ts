/**
 * Unit tests for the tool connectors (lib/connectors/{cornerstone,adp,kelio}.ts).
 *
 * Each connector builds its own axios instance via `createHttpClient` (→
 * `axios.create()`), so we mock that factory to hand back a controllable
 * `{ request: jest.fn() }` — no real HTTP call ever reaches
 * api.cornerstone.com / api.adp.fr / api.kelio.com. DatabaseManager is
 * mocked so no real Postgres connection is required.
 */

import axios from 'axios';
import DatabaseManager from '@/lib/database';
import { CornerStoneAPI } from '@/lib/connectors/cornerstone';
import { ADPApi } from '@/lib/connectors/adp';
import { KelioAPI } from '@/lib/connectors/kelio';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.mock('@/lib/database');

describe('Connectors', () => {
  let mockRequest: jest.Mock;
  let mockDb: { connect: jest.Mock; query: jest.Mock };

  beforeEach(() => {
    mockRequest = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({ request: mockRequest });

    mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    };
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDb);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('CornerStoneAPI.syncUsers()', () => {
    it('upserts every valid user and reports success when there are no failures', async () => {
      mockRequest.mockResolvedValue({
        data: {
          users: [
            { id: 'u1', firstName: 'Jean', lastName: 'Dupont', email: 'jean@lesaffre.com' },
            { id: 'u2', firstName: 'Marie', lastName: 'Curie', email: 'marie@lesaffre.com' },
          ],
        },
      });

      const result = await new CornerStoneAPI().syncUsers();

      expect(result).toEqual({ success: true, userssynced: 2, usersFailed: 0, errors: [] });
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employees'),
        ['Jean', 'Dupont', 'jean@lesaffre.com', 'u1']
      );
    });

    it('skips and counts invalid records (missing email) without upserting them', async () => {
      mockRequest.mockResolvedValue({
        data: { users: [{ id: 'u1', firstName: 'No', lastName: 'Email' }] },
      });

      const result = await new CornerStoneAPI().syncUsers();

      expect(result.userssynced).toBe(0);
      expect(result.usersFailed).toBe(1);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid user record');
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('counts a per-row DB failure without aborting the rest of the batch', async () => {
      mockRequest.mockResolvedValue({
        data: {
          users: [
            { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@lesaffre.com' },
            { id: 'u2', firstName: 'C', lastName: 'D', email: 'c@lesaffre.com' },
          ],
        },
      });
      mockDb.query
        .mockRejectedValueOnce(new Error('duplicate key value'))
        .mockResolvedValueOnce({ rows: [] });

      const result = await new CornerStoneAPI().syncUsers();

      expect(result.userssynced).toBe(1);
      expect(result.usersFailed).toBe(1);
      expect(result.errors[0]).toContain('Failed to sync user a@lesaffre.com');
    });

    it('retries the fetch up to 3 times on failure, then returns success: false without touching the DB', async () => {
      jest.useFakeTimers();
      mockRequest.mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.cornerstone.com'));

      const resultPromise = new CornerStoneAPI().syncUsers();
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(mockRequest).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        success: false,
        userssynced: 0,
        usersFailed: 0,
        errors: ['getaddrinfo ENOTFOUND api.cornerstone.com'],
      });
      expect(mockDb.connect).not.toHaveBeenCalled();
    });
  });

  describe('ADPApi.syncEmployees()', () => {
    it('upserts valid employees with hire_date/department/adp_id', async () => {
      mockRequest.mockResolvedValue({
        data: {
          employees: [
            {
              id: 'e1',
              firstName: 'Anas',
              lastName: 'Mehri',
              email: 'anas@lesaffre.com',
              hireDate: '2022-01-15',
              department: 'IT',
            },
          ],
        },
      });

      const result = await new ADPApi().syncEmployees();

      expect(result).toEqual({ success: true, employeesSynced: 1, employeesFailed: 0, errors: [] });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employees'),
        ['Anas', 'Mehri', 'anas@lesaffre.com', '2022-01-15', 'IT', 'e1']
      );
    });

    it('rejects records missing an id or email', async () => {
      mockRequest.mockResolvedValue({ data: { employees: [{ id: 'e1' }] } });

      const result = await new ADPApi().syncEmployees();

      expect(result.employeesFailed).toBe(1);
      expect(result.employeesSynced).toBe(0);
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('KelioAPI.syncTimesheets()', () => {
    it('merges timesheets and punch records and upserts the kelio_id link for each valid one', async () => {
      mockRequest.mockImplementation((config: { url: string }) => {
        if (config.url === '/timesheets') {
          return Promise.resolve({
            data: { timesheets: [{ id: 't1', employeeEmail: 'anas@lesaffre.com', kelioId: 'K1' }] },
          });
        }
        return Promise.resolve({
          data: { punchRecords: [{ id: 'p1', employeeEmail: 'marie@lesaffre.com', kelioId: 'K2' }] },
        });
      });

      const result = await new KelioAPI().syncTimesheets();

      expect(result).toEqual({ success: true, timesheetsSynced: 2, timeSheetsFailed: 0, errors: [] });
      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO employees'), [
        'anas@lesaffre.com',
        'K1',
      ]);
      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO employees'), [
        'marie@lesaffre.com',
        'K2',
      ]);
    });

    it('counts a record with no kelioId as invalid and does not upsert it', async () => {
      mockRequest.mockImplementation((config: { url: string }) => {
        if (config.url === '/timesheets') {
          return Promise.resolve({ data: { timesheets: [{ id: 't1', employeeEmail: 'anas@lesaffre.com' }] } });
        }
        return Promise.resolve({ data: { punchRecords: [] } });
      });

      const result = await new KelioAPI().syncTimesheets();

      expect(result.timeSheetsFailed).toBe(1);
      expect(result.timesheetsSynced).toBe(0);
    });

    it('fails the whole sync when either the timesheets or punch-records fetch is exhausted after retries', async () => {
      jest.useFakeTimers();
      mockRequest.mockImplementation((config: { url: string }) => {
        if (config.url === '/timesheets') {
          return Promise.reject(new Error('503 Service Unavailable'));
        }
        return Promise.resolve({ data: { punchRecords: [] } });
      });

      const resultPromise = new KelioAPI().syncTimesheets();
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['503 Service Unavailable']);
    });
  });
});
