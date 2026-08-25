/**
 * Unit tests for the export pipeline: CSVGenerator, PDFGenerator, and the
 * hand-rolled ZIP writer (lib/export/{csv-generator,pdf-generator,zip}.ts).
 *
 * DatabaseManager is mocked (no real Postgres needed). pdfkit and the ZIP
 * writer's zlib calls run for real — they're pure, I/O-free libraries, so
 * exercising them for real is both safe and more meaningful than mocking.
 */

import { Readable } from 'node:stream';
import { inflateRawSync } from 'node:zlib';
import DatabaseManager from '@/lib/database';
import { CSVGenerator } from '@/lib/export/csv-generator';
import { PDFGenerator } from '@/lib/export/pdf-generator';
import { createZip } from '@/lib/export/zip';

jest.mock('@/lib/database');

async function streamToString(stream: Readable): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
  }
  return chunks.join('');
}

async function readableToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function makeMockDb(queryImpl: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>) {
  return { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn(queryImpl) };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CSVGenerator', () => {
  describe('generateToolsReport()', () => {
    it('emits a UTF-8 BOM, a header row, and one correctly-formatted row per tool', async () => {
      const db = makeMockDb(async (sql) => {
        if (sql.includes('FROM tools')) {
          return {
            rows: [
              {
                id: 't1',
                name: 'Cornerstone LMS',
                category: 'Learning',
                country: 'Global',
                sync_status: 'success',
                last_sync: null,
                is_active: true,
                quality_score: '91',
                total_records: 100,
                invalid_records: 9,
                successful_syncs_7d: '5',
                failed_syncs_7d: '0',
              },
            ],
          };
        }
        return { rows: [] };
      });
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      const csv = await streamToString(await new CSVGenerator().generateToolsReport());
      const [headerLine, dataLine] = csv.split('\r\n');

      expect(headerLine.charCodeAt(0)).toBe(0xfeff);
      expect(headerLine.slice(1)).toBe(
        '"name","category","country","status","quality_score","last_sync","sync_count_7d"'
      );
      // quality 91% < 95% threshold → "degraded" (lib/tool-health.ts's real computeToolStatus)
      expect(dataLine).toBe('"Cornerstone LMS","Learning","Global","degraded","91","","5"');
    });
  });

  describe('generateEmployeesReport()', () => {
    it('quotes fields and doubles embedded quotes per RFC 4180', async () => {
      const db = makeMockDb(async () => ({
        rows: [
          {
            first_name: 'Jean',
            last_name: 'O"Brien, Jr.',
            email: 'jean@lesaffre.com',
            department: 'HR',
            hire_date: '2022-01-15',
            quality_score: 85,
            issues_count: '2',
          },
        ],
      }));
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      const csv = await streamToString(await new CSVGenerator().generateEmployeesReport());

      expect(csv).toContain('"O""Brien, Jr."');
      expect(csv).toContain('"2"'); // issues_count rendered as a quoted number
    });

    it('renders a Date value (as pg returns for DATE/TIMESTAMP columns) as ISO 8601, not toString()', async () => {
      const db = makeMockDb(async () => ({
        rows: [
          {
            first_name: 'Jean',
            last_name: 'Dupont',
            email: 'jean@lesaffre.com',
            department: 'HR',
            hire_date: new Date('2022-01-15T00:00:00.000Z'),
            quality_score: 85,
            issues_count: '0',
          },
        ],
      }));
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      const csv = await streamToString(await new CSVGenerator().generateEmployeesReport());

      expect(csv).toContain('"2022-01-15T00:00:00.000Z"');
      expect(csv).not.toContain('GMT');
    });
  });

  describe('generateAlertsReport()', () => {
    it('applies no date filter when no range is given', async () => {
      const db = makeMockDb(async () => ({ rows: [] }));
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      await streamToString(await new CSVGenerator().generateAlertsReport());

      expect(db.query).toHaveBeenCalledWith(expect.not.stringContaining('WHERE'), []);
    });

    it('applies a created_at >= / <= filter when a date range is given', async () => {
      const db = makeMockDb(async () => ({ rows: [] }));
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      await streamToString(
        await new CSVGenerator().generateAlertsReport({ from: '2026-01-01', to: '2026-01-31' })
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/created_at >= \$1[\s\S]*created_at <= \$2/),
        ['2026-01-01', '2026-01-31']
      );
    });

    it('renders a row for each alert', async () => {
      const db = makeMockDb(async () => ({
        rows: [
          {
            rule: 'NO_SYNC_24H',
            tool: 'cornerstone-lms',
            severity: 'critical',
            message: 'Cornerstone LMS has never synced.',
            status: 'open',
            created_at: '2026-08-24T21:00:00.000Z',
          },
        ],
      }));
      (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

      const csv = await streamToString(await new CSVGenerator().generateAlertsReport());

      expect(csv).toContain(
        '"NO_SYNC_24H","cornerstone-lms","critical","Cornerstone LMS has never synced.","open","2026-08-24T21:00:00.000Z"'
      );
    });
  });
});

describe('PDFGenerator.generateHealthReport()', () => {
  function mockToolHealthAndAlerts(overrides: {
    tools?: unknown[];
    alertCounts?: { severity: string; count: string }[];
    topIssues?: { issue: string; count: string }[];
  }) {
    const db = makeMockDb(async (sql) => {
      if (sql.includes('FROM tools')) return { rows: overrides.tools ?? [] };
      if (sql.includes("FROM alerts WHERE status = 'open'")) return { rows: overrides.alertCounts ?? [] };
      if (sql.includes('FROM employee_issues')) return { rows: overrides.topIssues ?? [] };
      return { rows: [] };
    });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    return db;
  }

  it('produces a well-formed, non-empty PDF document (magic header + trailer)', async () => {
    mockToolHealthAndAlerts({
      tools: [
        {
          id: 't1',
          name: 'Cornerstone LMS',
          category: 'Learning',
          country: 'Global',
          sync_status: 'success',
          last_sync: '2026-08-24T21:00:00.000Z',
          is_active: true,
          quality_score: '91',
          total_records: 100,
          invalid_records: 9,
          successful_syncs_7d: '5',
          failed_syncs_7d: '0',
        },
      ],
      alertCounts: [{ severity: 'critical', count: '2' }],
      topIssues: [{ issue: 'INVALID_EMAIL', count: '3' }],
    });

    const doc = await new PDFGenerator().generateHealthReport();
    const buffer = await readableToBuffer(doc);

    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.subarray(-64).toString('latin1')).toContain('%%EOF');
  });

  it('does not throw when there are no tools, no alerts, and no issues (fully empty state)', async () => {
    mockToolHealthAndAlerts({ tools: [], alertCounts: [], topIssues: [] });

    const doc = await new PDFGenerator().generateHealthReport();
    const buffer = await readableToBuffer(doc);

    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});

describe('createZip()', () => {
  interface LocalHeaderInfo {
    crc: number;
    compressedSize: number;
    uncompressedSize: number;
    nameLength: number;
    name: string;
    compressed: Buffer;
  }

  function readFirstLocalEntry(zip: Buffer): LocalHeaderInfo {
    expect(zip.readUInt32LE(0)).toBe(0x04034b50); // local file header signature
    const crc = zip.readUInt32LE(14);
    const compressedSize = zip.readUInt32LE(18);
    const uncompressedSize = zip.readUInt32LE(22);
    const nameLength = zip.readUInt16LE(26);
    const name = zip.subarray(30, 30 + nameLength).toString('utf8');
    const compressed = zip.subarray(30 + nameLength, 30 + nameLength + compressedSize);
    return { crc, compressedSize, uncompressedSize, nameLength, name, compressed };
  }

  it('produces a ZIP whose single entry inflates back to the original bytes', () => {
    const original = Buffer.from('name,category\r\n"Cornerstone LMS","Learning"\r\n', 'utf8');
    const zip = createZip([{ name: 'lesaffre_tools_2026-08-24.csv', data: original }]);

    const entry = readFirstLocalEntry(zip);
    expect(entry.name).toBe('lesaffre_tools_2026-08-24.csv');
    expect(entry.uncompressedSize).toBe(original.length);

    const inflated = inflateRawSync(entry.compressed);
    expect(inflated.equals(original)).toBe(true);
  });

  it('computes a correct CRC-32 of the uncompressed data', () => {
    const original = Buffer.from('hello world', 'utf8');
    const zip = createZip([{ name: 'test.txt', data: original }]);
    const entry = readFirstLocalEntry(zip);

    // Known CRC-32 of "hello world"
    expect(entry.crc).toBe(0x0d4a1185);
  });

  it('writes one local header + central directory entry per input file, and a matching EOCD count', () => {
    const zip = createZip([
      { name: 'a.csv', data: Buffer.from('a') },
      { name: 'b.csv', data: Buffer.from('b') },
    ]);

    // End Of Central Directory record is the last 22 bytes.
    const eocd = zip.subarray(zip.length - 22);
    expect(eocd.readUInt32LE(0)).toBe(0x06054b50);
    expect(eocd.readUInt16LE(8)).toBe(2); // entries on this disk
    expect(eocd.readUInt16LE(10)).toBe(2); // total entries

    // Central directory should contain 2 central-file-header signatures.
    const centralDirOffset = eocd.readUInt32LE(16);
    const centralDirSize = eocd.readUInt32LE(12);
    const centralDir = zip.subarray(centralDirOffset, centralDirOffset + centralDirSize);
    const firstSig = centralDir.readUInt32LE(0);
    expect(firstSig).toBe(0x02014b50);
  });
});
