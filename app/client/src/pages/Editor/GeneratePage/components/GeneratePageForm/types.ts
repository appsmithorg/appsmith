export interface GeneratePagePayload {
  tableName: string;
  columns?: string[];
  searchColumn?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pluginSpecificParams?: Record<any, any>;
}
