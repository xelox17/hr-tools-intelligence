/**
 * Unit tests for DatabaseManager (lib/database.ts).
 *
 * `pg` is mocked at the module level — `new Pool()` is intercepted so no
 * real TCP connection is ever attempted. Because DatabaseManager is a
 * singleton constructed as a side effect of importing the module
 * (`export const db = DatabaseManager.getInstance()`), each test gets a
 * fresh module registry via `jest.resetModules()` so singleton state and
 * env-var-driven config don't leak between tests.
 */

interface MockClient {
  query: jest.Mock;
  release: jest.Mock;
}

interface MockPool {
  connect: jest.Mock;
  query: jest.Mock;
  end: jest.Mock;
  on: jest.Mock;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

function makeMockClient(): MockClient {
  return { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }), release: jest.fn() };
}

function makeMockPool(): MockPool {
  return {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  };
}

describe('DatabaseManager', () => {
  let mockPool: MockPool;
  let PoolCtor: jest.Mock;

  function loadDatabaseManager() {
    // Dynamic require (not a static import) is required here: jest.resetModules()
    // needs a fresh module instance per test, which a hoisted top-level import can't give us.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/lib/database').default as typeof import('@/lib/database').default;
  }

  beforeEach(() => {
    jest.resetModules();
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;

    mockPool = makeMockPool();
    PoolCtor = jest.fn(() => mockPool);

    jest.doMock('pg', () => ({ Pool: PoolCtor }));
  });

  afterEach(() => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
  });

  describe('singleton behavior', () => {
    it('returns the same instance across multiple getInstance() calls', () => {
      const DatabaseManager = loadDatabaseManager();

      const first = DatabaseManager.getInstance();
      const second = DatabaseManager.getInstance();

      expect(first).toBe(second);
    });

    it('constructs the underlying pg.Pool only once, even after multiple getInstance() calls', () => {
      const DatabaseManager = loadDatabaseManager();

      DatabaseManager.getInstance();
      DatabaseManager.getInstance();
      DatabaseManager.getInstance();

      expect(PoolCtor).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection pool configuration', () => {
    it('defaults to localhost/5432/lesaffre_hr/postgres when no DB_* env vars are set', () => {
      const DatabaseManager = loadDatabaseManager();
      DatabaseManager.getInstance();

      expect(PoolCtor).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 5432,
          database: 'lesaffre_hr',
          user: 'postgres',
          password: 'postgres',
          max: 20,
        })
      );
    });

    it('reads connection settings from DB_* environment variables when set', () => {
      process.env.DB_HOST = 'db.internal';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'custom_db';
      process.env.DB_USER = 'custom_user';
      process.env.DB_PASSWORD = 'custom_pass';

      const DatabaseManager = loadDatabaseManager();
      DatabaseManager.getInstance();

      expect(PoolCtor).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'db.internal',
          port: 5433,
          database: 'custom_db',
          user: 'custom_user',
          password: 'custom_pass',
        })
      );
    });

    it('registers an error handler on the pool so idle-client errors do not crash the process', () => {
      const DatabaseManager = loadDatabaseManager();
      DatabaseManager.getInstance();

      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('connect()', () => {
    it('acquires a client, runs a round-trip query, and releases the client', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);

      const db = DatabaseManager.getInstance();
      await db.connect();

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(client.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('is a no-op on the second call (does not re-acquire a client)', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);

      const db = DatabaseManager.getInstance();
      await db.connect();
      await db.connect();

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('propagates and does not swallow a connection error', async () => {
      const DatabaseManager = loadDatabaseManager();
      const connectionError = new Error('connection refused');
      mockPool.connect.mockRejectedValue(connectionError);

      const db = DatabaseManager.getInstance();

      await expect(db.connect()).rejects.toThrow('connection refused');
    });
  });

  describe('query()', () => {
    it('delegates to pool.query and returns its result', async () => {
      const DatabaseManager = loadDatabaseManager();
      const expected = { rows: [{ id: 1, name: 'Cornerstone LMS' }], rowCount: 1 };
      mockPool.query.mockResolvedValue(expected);

      const db = DatabaseManager.getInstance();
      const result = await db.query('SELECT * FROM tools WHERE id = $1', ['abc']);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM tools WHERE id = $1', ['abc']);
      expect(result).toBe(expected);
    });

    it('throws (and does not silently swallow) a query error', async () => {
      const DatabaseManager = loadDatabaseManager();
      const queryError = new Error('relation "tools" does not exist');
      mockPool.query.mockRejectedValue(queryError);

      const db = DatabaseManager.getInstance();

      await expect(db.query('SELECT * FROM tools')).rejects.toThrow(
        'relation "tools" does not exist'
      );
    });
  });

  describe('transaction()', () => {
    it('commits when the callback succeeds', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);

      const db = DatabaseManager.getInstance();
      const result = await db.transaction(async () => 'ok');

      expect(result).toBe('ok');
      expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(client.query).toHaveBeenNthCalledWith(2, 'COMMIT');
      expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('rolls back and rethrows when the callback throws', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);
      const callbackError = new Error('insert violates constraint');

      const db = DatabaseManager.getInstance();

      await expect(
        db.transaction(async () => {
          throw callbackError;
        })
      ).rejects.toThrow('insert violates constraint');

      expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
      expect(client.query).not.toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalledTimes(1);
    });

    it('always releases the client, even when rollback itself is what we are verifying', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);

      const db = DatabaseManager.getInstance();

      await expect(
        db.transaction(async () => {
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');

      expect(client.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('close()', () => {
    it('ends the pool and allows connect() to re-acquire afterwards', async () => {
      const DatabaseManager = loadDatabaseManager();
      const client = makeMockClient();
      mockPool.connect.mockResolvedValue(client);

      const db = DatabaseManager.getInstance();
      await db.connect();
      await db.close();
      await db.connect();

      expect(mockPool.end).toHaveBeenCalledTimes(1);
      expect(mockPool.connect).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats()', () => {
    it('reports the pool counters', () => {
      mockPool.totalCount = 5;
      mockPool.idleCount = 3;
      mockPool.waitingCount = 1;

      const DatabaseManager = loadDatabaseManager();
      const db = DatabaseManager.getInstance();

      expect(db.getStats()).toEqual({
        totalConnections: 5,
        idleConnections: 3,
        waitingConnections: 1,
      });
    });
  });
});
