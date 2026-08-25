import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

const CSV_TYPES = ['tools', 'employees', 'alerts'];
const PDF_TYPES = ['health', 'summary'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

interface ScheduleRow {
  id: string;
  type: string;
  format: string;
  frequency: string;
  recipients: string[];
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

interface CreateScheduleBody {
  type?: string;
  frequency?: string;
  recipients?: string[];
  enabled?: boolean;
}

function computeNextRun(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<ScheduleRow>(
      `SELECT id, type, format, frequency, recipients, enabled, last_run, next_run, created_at
       FROM scheduled_exports
       ORDER BY created_at DESC`
    );

    return successResponse({ scheduledExports: result.rows });
  } catch (error) {
    console.error('❌ Failed to list scheduled exports:', error);
    return ErrorResponses.internalError('Failed to list scheduled exports', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduleBody = await request.json();

    if (!body.type || (!CSV_TYPES.includes(body.type) && !PDF_TYPES.includes(body.type))) {
      return ErrorResponses.badRequest(
        `A "type" field is required and must be one of: ${[...CSV_TYPES, ...PDF_TYPES].join(', ')}.`
      );
    }
    if (!body.frequency || !VALID_FREQUENCIES.includes(body.frequency)) {
      return ErrorResponses.badRequest(
        `A "frequency" field is required and must be one of: ${VALID_FREQUENCIES.join(', ')}.`
      );
    }
    if (body.recipients !== undefined && !Array.isArray(body.recipients)) {
      return ErrorResponses.badRequest('"recipients" must be an array of email addresses.');
    }

    const format = CSV_TYPES.includes(body.type) ? 'csv' : 'pdf';
    const nextRun = computeNextRun(body.frequency);

    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<ScheduleRow>(
      `INSERT INTO scheduled_exports (type, format, frequency, recipients, enabled, next_run)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, format, frequency, recipients, enabled, last_run, next_run, created_at`,
      [body.type, format, body.frequency, body.recipients ?? [], body.enabled ?? true, nextRun]
    );

    return successResponse({ scheduledExport: result.rows[0] }, undefined, 201);
  } catch (error) {
    console.error('❌ Failed to create scheduled export:', error);
    return ErrorResponses.internalError('Failed to create scheduled export', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ErrorResponses.badRequest('Query param "id" is required.');
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query('DELETE FROM scheduled_exports WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return ErrorResponses.notFound(`Scheduled export "${id}"`);
    }

    return successResponse({ deleted: true, id });
  } catch (error) {
    console.error('❌ Failed to delete scheduled export:', error);
    return ErrorResponses.internalError('Failed to delete scheduled export', error);
  }
}
