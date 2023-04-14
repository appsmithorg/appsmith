import MongoDB from "./MongoDB";

describe("WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      formData: {
        command: { data: "FIND" },
        aggregate: { limit: { data: "10" } },
        delete: { limit: { data: "SINGLE" } },
        updateMany: { limit: { data: "SINGLE" } },
        smartSubstitution: { data: true },
      },
    },
  };
  test("should build select form data correctly", () => {
    const expr = MongoDB.build(
      {
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
          // ignore columns
          columns: [{ name: "someColumn1", alias: "someColumn1" }],
          widgetId: "someWidgetId",
          searchableColumn: "title",
        },
        version: 0,
        recordsCount: false,
      },
      initialValues,
    );
    expect(expr).toEqual([
      {
        actionTitle: "Find_query",
        actionPayload: {
          formData: {
            collection: {
              data: "someTable",
            },
            smartSubstitution: { data: true },
            aggregate: { limit: { data: "10" } },
            command: {
              data: "FIND",
            },
            find: {
              limit: {
                data: "{{data_table.pageSize}}",
              },
              query: {
                data: '{ title: {{data_table.searchText||""}}/i }',
              },
              skip: {
                data: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
              },
              sort: {
                data: "{ {{data_table.sortOrder.column || 'genres'}}: {{data_table.sortOrder.order == \"desc\" ? -1 : 1}} }",
              },
            },
          },
        },
      },
    ]);
  });

  test("should build update form data correctly ", () => {
    const expr = MongoDB.build(
      {
        config: {
          tableName: "someTable",
          datasourceId: "someId",
          // ignore columns
          columns: [{ name: "someColumn1", alias: "someColumn1" }],
          widgetId: "someWidgetId",
          searchableColumn: "title",
        },
        version: 0,
        insert: {
          value: "{rating : {$gte : 9}}",
          where: "{ $inc: { score: 1 } }",
        },
        recordsCount: false,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        actionTitle: "Update_query",
        actionPayload: {
          formData: {
            collection: {
              data: "someTable",
            },
            command: {
              data: "UPDATE",
            },
            aggregate: { limit: { data: "10" } },
            smartSubstitution: { data: true },
            updateMany: {
              query: {
                data: "{ $inc: { score: 1 } }",
              },
              limit: { data: "SINGLE" },
              update: {
                data: "{rating : {$gte : 9}}",
              },
            },
          },
        },
      },
    ]);
  });
  test("should build insert form data correctly ", () => {
    const expr = MongoDB.build(
      {
        config: {
          tableName: "someTable",
          datasourceId: "someId",
          // ignore columns
          columns: [{ name: "someColumn1", alias: "someColumn1" }],
          widgetId: "someWidgetId",
          searchableColumn: "title",
        },
        version: 0,
        create: {
          value: "{{insert_form.formData}}",
        },
        recordsCount: false,
      },
      initialValues,
    );
    expect(expr).toEqual([
      {
        actionTitle: "Insert_query",
        actionPayload: {
          formData: {
            collection: {
              data: "someTable",
            },
            aggregate: { limit: { data: "10" } },
            smartSubstitution: { data: true },
            command: {
              data: "INSERT",
            },
            insert: {
              documents: {
                data: "{{insert_form.formData}}",
              },
            },
          },
        },
      },
    ]);
  });
});
