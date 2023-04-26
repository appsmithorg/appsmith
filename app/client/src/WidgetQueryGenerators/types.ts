export type WidgetQueryGenerationFormConfig = {
  tableName: string;
  datasourceId: string;
  //TODO:check where to use this
  aliases: {
    name: string;
    alias: string;
  }[];
  widgetId: string;
  searchableColumn: string;
  columns: string[];
  primaryColumn: string;
  version: number;
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
    // we just the property name, since different Db generates query differently
    value: string;
  };
  update?: {
    // we just the property name, since different Db generates query differently
    value: string;
    where: string;
  };
  //TODO:check where to use this
  totalRecord: boolean; //whether we need to query to find total record
  version: number; //version of the config object
};

export enum QUERY_TYPE {
  SELECT = "select",
  UPDATE = "update",
  CREATE = "create",
  TOTAL_RECORD = "total_record",
}
