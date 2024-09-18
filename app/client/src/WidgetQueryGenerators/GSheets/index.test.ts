import { DatasourceConnectionMode } from "entities/Datasource";
import GSheets from ".";

describe("GSheets WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      formData: {
        entityType: {
          data: "ROWS",
        },
        tableHeaderIndex: {
          data: "1",
        },
        projection: {
          data: [],
        },
        queryFormat: {
          data: "ROWS",
        },
        range: {
          data: "",
        },
        where: {
          data: {
            condition: "AND",
          },
        },
        pagination: {
          data: {
            limit: "{{Table1.pageSize}}",
            offset: "{{Table1.pageOffset}}",
          },
        },
        smartSubstitution: {
          data: true,
        },
      },
    },
  };

  test("should build select form data correctly", () => {
    const expr = GSheets.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: "data_table.searchText",
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column || 'genres'",
          sortOrder: 'data_table.sortOrder.order == "desc" ? -1 : 1',
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Find_someSheet",
        payload: {
          formData: {
            command: {
              data: "FETCH_MANY",
            },
            entityType: {
              data: "ROWS",
            },
            pagination: {
              data: {
                limit: "{{data_table.pageSize}}",
                offset: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
              },
            },
            projection: {
              data: [],
            },
            queryFormat: {
              data: "ROWS",
            },
            range: {
              data: "",
            },
            sheetName: {
              data: "someSheet",
            },
            sheetUrl: {
              data: "someTableUrl",
            },
            smartSubstitution: {
              data: true,
            },
            sortBy: {
              data: [
                {
                  column: "{{data_table.sortOrder.column || 'genres'}}",
                  order: 'data_table.sortOrder.order == "desc" ? -1 : 1',
                },
              ],
            },
            tableHeaderIndex: {
              data: "1",
            },
            where: {
              data: {
                children: [
                  {
                    condition: "CONTAINS",
                    key: '{{data_table.searchText ? "title" : ""}}',
                    value: "{{data_table.searchText}}",
                  },
                ],
                condition: "AND",
              },
            },
          },
        },
        type: "select",
        dynamicBindingPathList: [
          {
            key: "formData.where.data",
          },
          {
            key: "formData.sortBy.data",
          },
          {
            key: "formData.pagination.data",
          },
        ],
      },
    ]);
  });

  test("should build select form data without write permissions", () => {
    const expr = GSheets.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: "data_table.searchText",
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column || 'genres'",
          sortOrder: 'data_table.sortOrder.order == "desc" ? -1 : 1',
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Find_someSheet",
        payload: {
          formData: {
            command: {
              data: "FETCH_MANY",
            },
            entityType: {
              data: "ROWS",
            },
            pagination: {
              data: {
                limit: "{{data_table.pageSize}}",
                offset: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
              },
            },
            projection: {
              data: [],
            },
            queryFormat: {
              data: "ROWS",
            },
            range: {
              data: "",
            },
            sheetName: {
              data: "someSheet",
            },
            sheetUrl: {
              data: "someTableUrl",
            },
            smartSubstitution: {
              data: true,
            },
            sortBy: {
              data: [
                {
                  column: "{{data_table.sortOrder.column || 'genres'}}",
                  order: 'data_table.sortOrder.order == "desc" ? -1 : 1',
                },
              ],
            },
            tableHeaderIndex: {
              data: "1",
            },
            where: {
              data: {
                children: [
                  {
                    condition: "CONTAINS",
                    key: '{{data_table.searchText ? "title" : ""}}',
                    value: "{{data_table.searchText}}",
                  },
                ],
                condition: "AND",
              },
            },
          },
        },
        type: "select",
        dynamicBindingPathList: [
          {
            key: "formData.where.data",
          },
          {
            key: "formData.sortBy.data",
          },
          {
            key: "formData.pagination.data",
          },
        ],
      },
    ]);
  });

  test("should build update form data correctly ", () => {
    const expr = GSheets.build(
      {
        update: {
          value: "update_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Update_someSheet",
        payload: {
          formData: {
            command: {
              data: "UPDATE_ONE",
            },
            entityType: {
              data: "ROWS",
            },
            queryFormat: {
              data: "ROWS",
            },
            rowObjects: {
              data: "{{update_form.formData}}",
            },
            sheetName: {
              data: "someSheet",
            },
            sheetUrl: {
              data: "someTableUrl",
            },
            smartSubstitution: {
              data: true,
            },
            tableHeaderIndex: {
              data: "1",
            },
          },
        },
        dynamicBindingPathList: [
          {
            key: "formData.rowObjects.data",
          },
        ],
        type: "update",
      },
    ]);
  });

  test("should not build update form data without write permissions ", () => {
    const expr = GSheets.build(
      {
        update: {
          value: "update_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should build insert form data correctly ", () => {
    const expr = GSheets.build(
      {
        create: {
          value: "insert_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Insert_someSheet",
        payload: {
          formData: {
            command: {
              data: "INSERT_ONE",
            },
            entityType: {
              data: "ROWS",
            },
            queryFormat: {
              data: "ROWS",
            },
            rowObjects: {
              data: "{{insert_form.formData}}",
            },
            sheetName: {
              data: "someSheet",
            },
            sheetUrl: {
              data: "someTableUrl",
            },
            smartSubstitution: {
              data: true,
            },
            tableHeaderIndex: {
              data: "1",
            },
          },
        },
        type: "create",
        dynamicBindingPathList: [
          {
            key: "formData.rowObjects.data",
          },
        ],
      },
    ]);
  });

  test("should not build insert form data without write permissions ", () => {
    const expr = GSheets.build(
      {
        create: {
          value: "insert_form.formData",
        },
        totalRecord: false,
      },
      {
        tableName: "someTableUrl",
        datasourceId: "someId",
        // ignore columns
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        sheetName: "someSheet",
        tableHeaderIndex: 1,
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });
});
