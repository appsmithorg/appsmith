export type FormConfig = {
  config: {
    tableName: string;
    datasourceId: string;
    columns: {
      name: string;
      alias: string;
    }[];
    widgetId: string;
    searchableColumn: string;
  };
  version: number;
};

export type GetQueryGenerationConfigResponse = {
  select: {
    limit: string;
    offset: string;
    where: string;
    orderBy: string;
    sortOrder: string;
  };
  create: {
    // we just the property name, since different Db generates query differently
    value: string;
  };
  insert: {
    // we just the property name, since different Db generates query differently
    value: string;
    where: string;
  };
  recordsCount: boolean; //whether we need to query to find total record
  version: number; //version of the config object
};
export type CombinedConfig = FormConfig & GetQueryGenerationConfigResponse;
/*
{
\n  "find": "rd_voting",
    \n  "filter": { note: /{{data_table.searchText||""}}/i },
    \n  "sort": {
        \n{
            {
                data_table.sortOrder.column || \'members\'}}: {{data_table.sortOrder.order == "desc" ? -1 : 1}} \n},\n  "skip": {{(data_table.pageNo - 1) * data_table.pageSize}},
                \n  "limit": { { data_table.pageSize } },
    \n  "batchSize": {{data_table.pageSize}}\n}\n'
*/
