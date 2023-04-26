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
};

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
    where: string;
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
