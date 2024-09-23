import { DatasourceConnectionMode } from "entities/Datasource";
import MongoDB from ".";

describe("Mongo WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      formData: {
        command: { data: "FIND" },
        aggregate: { limit: { data: "10" } },
        delete: { limit: { data: "SINGLE" } },
        updateMany: { limit: { data: "SINGLE" } },
        smartSubstitution: { data: true },
        find: { data: "" },
        insert: { data: "" },
        count: { data: "" },
      },
    },
  };

  test("should build select form data correctly", () => {
    const expr = MongoDB.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText||""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column || 'genres'",
          sortOrder: 'data_table.sortOrder.order == "desc" ? -1 : 1',
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        type: "select",
        name: "Find_someTable",
        dynamicBindingPathList: [
          {
            key: "formData.find.skip.data",
          },
          {
            key: "formData.find.query.data",
          },
          {
            key: "formData.find.sort.data",
          },
          {
            key: "formData.find.limit.data",
          },
        ],
        payload: {
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
              data: "",
              limit: {
                data: "{{data_table.pageSize}}",
              },
              query: {
                data: `{{{ title: {$regex: data_table.searchText||"", '$options' : 'i'} }}}`,
              },
              skip: {
                data: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
              },
              sort: {
                data: "{{ data_table.sortOrder.column || 'genres' ? { [data_table.sortOrder.column || 'genres']: data_table.sortOrder.order == \"desc\" ? -1 : 1 ? 1 : -1 } : {}}}",
              },
            },
          },
        },
      },
    ]);
  });

  test("should build select form data without write permissions", () => {
    const expr = MongoDB.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText||""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column || 'genres'",
          sortOrder: 'data_table.sortOrder.order == "desc" ? -1 : 1',
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        type: "select",
        name: "Find_someTable",
        dynamicBindingPathList: [
          {
            key: "formData.find.skip.data",
          },
          {
            key: "formData.find.query.data",
          },
          {
            key: "formData.find.sort.data",
          },
          {
            key: "formData.find.limit.data",
          },
        ],
        payload: {
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
              data: "",
              limit: {
                data: "{{data_table.pageSize}}",
              },
              query: {
                data: `{{{ title: {$regex: data_table.searchText||"", '$options' : 'i'} }}}`,
              },
              skip: {
                data: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
              },
              sort: {
                data: "{{ data_table.sortOrder.column || 'genres' ? { [data_table.sortOrder.column || 'genres']: data_table.sortOrder.order == \"desc\" ? -1 : 1 ? 1 : -1 } : {}}}",
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
        update: {
          value: "{rating : {$gte : 9}}",
          where: "{ $inc: { score: 1 } }",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Update_someTable",
        type: "update",
        dynamicBindingPathList: [
          {
            key: "formData.updateMany.query.data",
          },
          {
            key: "formData.updateMany.update.data",
          },
        ],
        payload: {
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
                data: "{_id: ObjectId('{{{ $inc: { score: 1 } }._id}}')}",
              },
              limit: { data: "SINGLE" },
              update: {
                data: '{{{$set: _.omit({rating : {$gte : 9}}, "_id")}}}',
              },
            },
          },
        },
      },
    ]);
  });

  test("should not build update form data without write permissions ", () => {
    const expr = MongoDB.build(
      {
        update: {
          value: "{rating : {$gte : 9}}",
          where: "{ $inc: { score: 1 } }",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should build insert form data correctly ", () => {
    const expr = MongoDB.build(
      {
        create: {
          value: "insert_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Insert_someTable",
        type: "create",
        dynamicBindingPathList: [
          {
            key: "formData.insert.documents.data",
          },
        ],
        payload: {
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
              data: "",
              documents: {
                data: "{{insert_form.formData}}",
              },
            },
          },
        },
      },
    ]);
  });

  test("should not build insert form data without write permissions ", () => {
    const expr = MongoDB.build(
      {
        create: {
          value: "insert_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });
});
