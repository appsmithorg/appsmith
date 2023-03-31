import MongoDB from "./mongoDb";

describe("WidgetProps tests", () => {
  const mongoDb = new MongoDB();
  const expr = mongoDb.buildSelectQuery({
    select: {
      limit: "{{data_table.pageSize}}",
      where: '{{data_table.searchText||""}}/i',
      offset: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
      orderBy: "{{data_table.sortOrder.column || 'genres'}}",
      sortOrder: '{{data_table.sortOrder.order == "desc" ? -1 : 1}}',
    },
    config: {
      tableName: "someTable",
      datasourceId: "someId",
      // ignore it columns
      columns: [{ name: "someColumn1", alias: "someColumn1" }],
      widgetId: "someWidgetId",
      searchableColumn: "title",
    },
    version: 0,
    create: {
      value: "",
    },
    insert: {
      value: "",
      where: "",
    },
    recordsCount: false,
  });
  expect(expr).toEqual([
    { limit: "{{data_table.pageSize}}" },
    { filter: { title: '{{data_table.searchText||""}}/i' } },
    { skip: "{{(data_table.pageNo - 1) * data_table.pageSize}}" },
    {
      sort: {
        "{{data_table.sortOrder.column || 'genres'}}":
          '{{data_table.sortOrder.order == "desc" ? -1 : 1}}',
      },
    },
  ]);
});
