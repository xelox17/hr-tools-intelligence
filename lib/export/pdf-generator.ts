import PDFDocument from 'pdfkit';
import DatabaseManager from '@/lib/database';
import { computeToolStatus, fetchToolHealthRows } from '@/lib/tool-health';

const CM = 28.35;
const NAVY = '#0a1f44';
const MUTED = '#5b6b85';
const INK = '#16233b';
const BORDER = '#e3e8f0';

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]): void {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / headers.length;
  let y = doc.y;

  doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY);
  headers.forEach((header, i) => doc.text(header, startX + i * colWidth, y, { width: colWidth }));
  y += 16;
  doc
    .moveTo(startX, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(BORDER)
    .stroke();
  y += 6;

  doc.font('Helvetica').fillColor(INK);
  for (const row of rows) {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    row.forEach((cell, i) => doc.text(cell, startX + i * colWidth, y, { width: colWidth }));
    y += 16;
  }

  doc.x = startX;
  doc.y = y;
}

export class PDFGenerator {
  async generateHealthReport(): Promise<PDFKit.PDFDocument> {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const toolRows = await fetchToolHealthRows(db);

    const alertsResult = await db.query<{ severity: string; count: string }>(
      `SELECT severity, COUNT(*) AS count FROM alerts WHERE status = 'open' GROUP BY severity`
    );
    const openAlertsCount = alertsResult.rows.reduce((sum, row) => sum + Number(row.count), 0);

    const topIssuesResult = await db.query<{ issue: string; count: string }>(
      `SELECT issue_type AS issue, COUNT(*) AS count
       FROM employee_issues
       WHERE status = 'open'
       GROUP BY issue_type
       ORDER BY count DESC
       LIMIT 5`
    );

    const qualityScores = toolRows
      .map((row) => (row.quality_score !== null ? Number(row.quality_score) : null))
      .filter((value): value is number => value !== null);
    const avgQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, value) => sum + value, 0) / qualityScores.length
        : null;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: CM, bottom: CM, left: CM, right: CM },
      bufferPages: true,
    });

    doc.fontSize(20).fillColor(NAVY).font('Helvetica-Bold').text('Lesaffre HR Tools — Health Report');
    doc.fontSize(10).font('Helvetica').fillColor(MUTED).text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown(1.2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(NAVY).text('Executive Summary');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor(INK);
    doc.text(`Open alerts: ${openAlertsCount}`);
    doc.text(`Average tool quality score: ${avgQuality !== null ? `${avgQuality.toFixed(1)}%` : 'N/A'}`);
    doc.text(`Tools tracked: ${toolRows.length}`);
    doc.moveDown(1.2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(NAVY).text('Tool Health Status');
    doc.moveDown(0.4);
    drawTable(
      doc,
      ['Tool', 'Status', 'Quality', 'Last sync'],
      toolRows.map((row) => {
        const qualityScore = row.quality_score !== null ? Number(row.quality_score) : null;
        const failedSyncs7d = Number(row.failed_syncs_7d);
        const status = computeToolStatus(row, qualityScore, failedSyncs7d);
        return [
          row.name,
          status,
          qualityScore !== null ? `${qualityScore}%` : '—',
          row.last_sync ? new Date(row.last_sync).toLocaleString() : 'Never',
        ];
      })
    );
    doc.moveDown(1.2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(NAVY).text('Data Quality Metrics');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Courier').fillColor(INK);
    for (const row of toolRows) {
      const qualityScore = row.quality_score !== null ? Number(row.quality_score) : null;
      const filled = qualityScore !== null ? Math.round(qualityScore / 5) : 0;
      const bar = qualityScore !== null ? '#'.repeat(filled).padEnd(20, '-') : '-'.repeat(20);
      const label = qualityScore !== null ? `${qualityScore}%` : 'no data';
      doc.text(`${row.name.padEnd(24).slice(0, 24)} [${bar}] ${label}`);
    }
    doc.font('Helvetica');
    doc.moveDown(1.2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor(NAVY).text('Top Issues');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor(INK);
    if (topIssuesResult.rows.length === 0) {
      doc.text('No open issues recorded.');
    } else {
      for (const issue of topIssuesResult.rows) {
        doc.text(`• ${issue.issue}: ${issue.count}`);
      }
    }

    doc.end();
    return doc;
  }
}
