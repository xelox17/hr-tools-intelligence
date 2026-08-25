import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator } from '@/lib/export/pdf-generator';
import { createZip } from '@/lib/export/zip';

const ZIP_THRESHOLD_BYTES = 10 * 1024 * 1024;
const VALID_TYPES = ['health', 'summary'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'health';

    if (!(VALID_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json(
        { success: false, error: `Query param "type" must be one of: ${VALID_TYPES.join(', ')}.` },
        { status: 400 }
      );
    }

    const generator = new PDFGenerator();
    const doc = await generator.generateHealthReport();

    const chunks: Buffer[] = [];
    for await (const chunk of doc) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    const dateStamp = new Date().toISOString().slice(0, 10);
    let body: Buffer = pdfBuffer;
    let filename = `lesaffre_report_${dateStamp}.pdf`;
    let contentType = 'application/pdf';

    if (pdfBuffer.byteLength > ZIP_THRESHOLD_BYTES) {
      body = createZip([{ name: filename, data: pdfBuffer }]);
      filename = `lesaffre_report_${dateStamp}.zip`;
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
    console.error('❌ PDF export failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
