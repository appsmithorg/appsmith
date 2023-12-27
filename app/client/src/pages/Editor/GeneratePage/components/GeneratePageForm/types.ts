export interface GeneratePagePayload {
  tableName: string;
  columns?: string[];
  searchColumn?: string;
  pluginSpecificParams?: Record<any, any>;
}
