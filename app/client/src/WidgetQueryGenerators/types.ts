type GsheetConfig = {
  sheetName?: string;
  tableHeaderIndex?: number;
};
export type WidgetQueryGenerationFormConfig = {
  tableName: string;
  datasourceId: string;
  aliases: {
    name: string;
    alias: string;
  }[];
  widgetId: string;
  searchableColumn: string;
  columns: string[];
  primaryColumn: string;
} & GsheetConfig;

export type WidgetQueryGenerationConfig = {
  select?: {
    limit: string;
    offset: string;
    where: string;
    orderBy: string;
    sortOrder: string;
  };
  create?: {
    value: string;
  };
  update?: {
    value: string;
    where?: string;
  };
  totalRecord: boolean;
};

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

export type MongoDBFormData = {
  aggregate: object;
  smartSubstitution: object;
  find: object;
  updateMany: object;
  insert: object;
  count: object;
};
export type ActionConfigurationMongoDB = {
  formData: MongoDBFormData;
};

export type ActionConfigurationSQL = {
  pluginSpecifiedTemplates: Array<object>;
};

export type GSheetsFormData = {
  entityType: object;
  tableHeaderIndex: object;
  projection: object;
  queryFormat: object;
  range: object;
  where: object;
  pagination: object;
  smartSubstitution: object;
};
export type ActionConfigurationGSheets = {
  formData: GSheetsFormData;
};
