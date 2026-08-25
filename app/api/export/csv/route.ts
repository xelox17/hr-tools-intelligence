import { NextRequest, NextResponse } from 'next/server';
import { CSVGenerator } from '@/lib/export/csv-generator';
import { createZip } from '@/lib/export/zip';

const ZIP_THRESHOLD_BYTES = 10 * 1024 * 1024;
const VALID_TYPES = ['tools', 'employees', 'alerts'] as const;
type ExportType = (typeof VALID_TYPES)[number];

function isExportType(value: string | null): value is ExportType {
  return value !== null && (VALID_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;

    if (!isExportType(type)) {
      return NextResponse.json(
        { success: false, error: `Query param "type" must be one of: ${VALID_TYPES.join(', ')}.` },
        { status: 400 }
      );
    }

    const generator = new CSVGenerator();
    const stream =
      type === 'tools'
        ? await generator.generateToolsReport()
        : type === 'employees'
          ? await generator.generateEmployeesReport()
          : await generator.generateAlertsReport({ from: dateFrom, to: dateTo });

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const csvBuffer = Buffer.concat(chunks);

    const dateStamp = new Date().toISOString().slice(0, 10);
    let body: Buffer = csvBuffer;
    let filename = `lesaffre_${type}_${dateStamp}.csv`;
    let contentType = 'text/csv; charset=utf-8';

    if (csvBuffer.byteLength > ZIP_THRESHOLD_BYTES) {
      body = createZip([{ name: filename, data: csvBuffer }]);
      filename = `lesaffre_${type}_${dateStamp}.zip`;
      contentType = 'application/zip';
    }

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(body.byteLength),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ CSV export failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
