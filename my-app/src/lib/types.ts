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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    took_ms?: number;
  };
}
