import type { AlertMessage } from "components/editorComponents/WidgetQueryGeneratorForm/types";

export interface Column {
  name: string;
  type: string;
  isSelected: boolean;
}

interface GsheetConfig {
  sheetName?: string;
  tableHeaderIndex?: number;
}
export type WidgetQueryGenerationFormConfig = {
  tableName: string;
  datasourceId: string;
  aliases: {
    name: string;
    alias: string;
  }[];
  widgetId: string;
  searchableColumn: string;
  columns: Column[];
  primaryColumn: string;
  connectionMode: string;
  otherFields?: Record<string, unknown>;
  alertMessage?: AlertMessage;
  dataIdentifier?: string;
} & GsheetConfig;

export interface WidgetQueryGenerationConfig {
  select?: {
    limit?: string;
    offset?: string;
    where?: string;
    orderBy?: string;
    sortOrder?: string;
  };
  create?: {
    value: string;
  };
  update?: {
    value: string;
    where?: string;
  };
  totalRecord?: boolean;
}

export enum QUERY_TYPE {
  SELECT = "select",
  UPDATE = "update",
  CREATE = "create",
  TOTAL_RECORD = "total_record",
}

export type WidgetQueryConfig = Record<
  string,
  {
    data: string;
    run: string;
  }
>;

export interface MongoDBFormData {
  aggregate: object;
  smartSubstitution: object;
  find: object;
  updateMany: object;
  insert: object;
  count: object;
}
export interface ActionConfigurationMongoDB {
  formData: MongoDBFormData;
}

export interface ActionConfigurationSQL {
  pluginSpecifiedTemplates: Array<object>;
}

export interface GSheetsFormData {
  entityType: object;
  tableHeaderIndex: object;
  projection: object;
  queryFormat: object;
  range: object;
  where: object;
  pagination: object;
  smartSubstitution: object;
}
export interface ActionConfigurationGSheets {
  formData: GSheetsFormData;
}
