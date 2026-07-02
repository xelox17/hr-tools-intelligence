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
