import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/swagger-config';

export async function GET() {
  return NextResponse.json(openApiSpec);
}
