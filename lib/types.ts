// Tes types existants
export type ToolScope = "Corporate" | "Local";

export interface Tool {
  id: string;
  name: string;
  category: string;
  scope: ToolScope;
  country: string;
  shortDescription: string;
  description: string[];
  url: string;
}

// ===== AJOUTE CES NOUVEAUX TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    took_ms?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SyncLog {
  id: number;
  tool_id: string;
  sync_type: string;
  sync_start: string;
  sync_end: string | null;
  records_synced: number;
  records_failed: number;
  records_skipped: number;
  status: string;
  error_message: string | null;
  error_code: string | null;
  triggered_by: string;
  request_id: string | null;
  created_at: string;
}

export interface DataQualityMetric {
  id: number;
  tool_id: string;
  metric_date: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  missing_required: number;
  quality_score: number;
  top_issues: string[];
  calculated_at: string;
}

export interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  department: string | null;
  job_title: string | null;
  manager_id: string | null;
  cornerstone_id: string | null;
  adp_id: string | null;
  kelio_id: string | null;
  data_quality_score: number;
  last_validated: string | null;
  created_at: string;
  updated_at: string;
  synced_from: string[];
}

export interface RequestContext {
  userId: string;
  userEmail: string;
  userRole: string;
  requestId: string;
  timestamp: number;
  ipAddress: string;
}

export interface PaginateOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}