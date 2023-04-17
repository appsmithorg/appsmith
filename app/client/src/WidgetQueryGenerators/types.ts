export type FormConfig = {
  config: {
    tableName: string;
    datasourceId: string;
    //TODO:check where to use this
    columns: {
      name: string;
      alias: string;
    }[];
    widgetId: string;
    searchableColumn: string;
  };
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
  insert?: {
    // we just the property name, since different Db generates query differently
    value: string;
    where: string;
  };
  //TODO:check where to use this
  recordsCount: boolean; //whether we need to query to find total record
  version: number; //version of the config object
};
export type CombinedConfig = FormConfig & WidgetQueryGenerationConfig;
