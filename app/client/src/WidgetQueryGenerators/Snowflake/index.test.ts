import { DatasourceConnectionMode } from "entities/Datasource";
import Snowflake from ".";
import { SSLType } from "entities/Datasource/RestAPIForm";

describe("Snowflake WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };

  test("should build select form data correctly", () => {
    const expr = Snowflake.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText || ""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column",
          sortOrder: "data_table.sortOrder.order || 'ASC'",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "genres",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    const res = `SELECT
  *
FROM
  someTable
WHERE
  title LIKE '%{{data_table.searchText || \"\"}}%'
ORDER BY
  {{data_table.sortOrder.column || 'genres'}} {{data_table.sortOrder.order || 'ASC' ? \"\" : \"DESC\"}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;

    expect(expr).toEqual([
      {
        name: "Select_someTable",
        type: "select",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          pluginSpecifiedTemplates: [{ value: false }],
          body: res,
        },
      },
    ]);
  });

  test("should build select form data correctly with read permissions", () => {
    const expr = Snowflake.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText || ""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column",
          sortOrder: "data_table.sortOrder.order || 'ASC'",
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "genres",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    const res = `SELECT
  *
FROM
  someTable
WHERE
  title LIKE '%{{data_table.searchText || \"\"}}%'
ORDER BY
  {{data_table.sortOrder.column || 'genres'}} {{data_table.sortOrder.order || 'ASC' ? \"\" : \"DESC\"}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;

    expect(expr).toEqual([
      {
        name: "Select_someTable",
        type: "select",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          pluginSpecifiedTemplates: [{ value: false }],
          body: res,
        },
      },
    ]);
  });

  test("should build select form data correctly without primary column", () => {
    const expr = Snowflake.build(
      {
        select: {
          limit: "data_table.pageSize",
          where: 'data_table.searchText || ""',
          offset: "(data_table.pageNo - 1) * data_table.pageSize",
          orderBy: "data_table.sortOrder.column",
          sortOrder: `data_table.sortOrder.order !== "desc"`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    const res = `SELECT
  *
FROM
  someTable
WHERE
  title LIKE '%{{data_table.searchText || \"\"}}%' {{data_table.sortOrder.column ? \"ORDER BY \" + data_table.sortOrder.column + \"  \" + (data_table.sortOrder.order !== \"desc\" ? \"\" : \"DESC\") : \"\"}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;

    expect(expr).toEqual([
      {
        name: "Select_someTable",
        type: "select",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          pluginSpecifiedTemplates: [{ value: false }],
          body: res,
        },
      },
    ]);
  });

  test("should not build update form data without primary key ", () => {
    const expr = Snowflake.build(
      {
        update: {
          value: `update_form.fieldState'`,
          where: `"id" = {{data_table.selectedRow.id}}`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should not build update form data without read write ", () => {
    const expr = Snowflake.build(
      {
        update: {
          value: `update_form.fieldState'`,
          where: `"id" = {{data_table.selectedRow.id}}`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "id",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should build update form data correctly ", () => {
    const expr = Snowflake.build(
      {
        update: {
          value: `update_form.fieldState'`,
          where: `data_table.selectedRow`,
        },
        totalRecord: false,
      },
      {
        tableName: "someTable",
        datasourceId: "someId",
        aliases: [{ name: "someColumn1", alias: "someColumn1" }],
        widgetId: "someWidgetId",
        searchableColumn: "title",
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "id",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
        dataIdentifier: "id",
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        name: "Update_someTable",
        type: "update",
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        payload: {
          body: "UPDATE someTable SET name= '{{update_form.fieldState'.name}}' WHERE id= '{{data_table.selectedRow.id}}';",
          pluginSpecifiedTemplates: [{ value: false }],
        },
      },
    ]);
  });

  test("should not build insert form data without primary key ", () => {
    const expr = Snowflake.build(
      {
        create: {
          value: `update_form.fieldState`,
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
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "",
        connectionMode: DatasourceConnectionMode.READ_WRITE,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should not build insert form data without read write permissions", () => {
    const expr = Snowflake.build(
      {
        create: {
          value: `update_form.fieldState`,
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
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "id",
        connectionMode: DatasourceConnectionMode.READ_ONLY,
      },
      initialValues,
    );

    expect(expr).toEqual([]);
  });

  test("should build insert form data correctly ", () => {
    const expr = Snowflake.build(
      {
        create: {
          value: `update_form.fieldState`,
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
        columns: [
          { name: "id", type: "number", isSelected: true },
          { name: "name", type: "number", isSelected: true },
        ],
        primaryColumn: "id",
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
            key: "body",
          },
        ],
        payload: {
          body: "INSERT INTO someTable (name) VALUES ('{{update_form.fieldState.name}}')",
          pluginSpecifiedTemplates: [{ value: false }],
        },
      },
    ]);
  });

  test("should return provided connection mode when available", () => {
    const datasourceConfiguration = {
      connection: {
        mode: DatasourceConnectionMode.READ_ONLY,
        ssl: {
          authType: SSLType.DEFAULT,
          authTypeControl: false,
          certificateFile: {
            name: "",
            base64Content: "",
          },
        },
      },
      url: "https://example.com",
    };

    const connectionMode = Snowflake.getConnectionMode(datasourceConfiguration);
    expect(connectionMode).toEqual(DatasourceConnectionMode.READ_ONLY);
  });

  test("should return READ_WRITE as default when no connection mode is provided", () => {
    const datasourceConfiguration = {
      // No connection mode specified
      url: "https://example.com",
    };

    const connectionMode = Snowflake.getConnectionMode(datasourceConfiguration);
    expect(connectionMode).toEqual(DatasourceConnectionMode.READ_WRITE);
  });
});
