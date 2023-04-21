import PostgreSQL from "./PostgreSQL";

describe("PostgreSQL WidgetQueryGenerator", () => {
  const initialValues = {
    actionConfiguration: {
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };
  test("should build select form data correctly", () => {
    const expr = PostgreSQL.build(
      {
        select: {
          limit: "{{data_table.pageSize}}",
          where: '{{data_table.searchText || ""}}',
          offset: "{{(data_table.pageNo - 1) * data_table.pageSize}}",
          orderBy: "{{data_table.sortOrder.column || 'genres'}}",
          sortOrder: "{{data_table.sortOrder.order || 'ASC'}}",
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
    const res = `SELECT
  *
FROM
  someTable
WHERE
  \"title\" ilike '%{{data_table.searchText || \"\"}}%'
ORDER BY
  \"{{data_table.sortOrder.column || 'genres'}}\" {{data_table.sortOrder.order || 'ASC'}}
LIMIT
  {{data_table.pageSize}}
OFFSET
  {{(data_table.pageNo - 1) * data_table.pageSize}}`;
    expect(expr).toEqual([
      {
        actionTitle: "Find_query",
        actionPayload: {
          pluginSpecifiedTemplates: [{ value: true }],
          body: res,
        },
      },
    ]);
  });

  test("should build update form data correctly ", () => {
    const expr = PostgreSQL.build(
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
          value: `"email" = '{{update_form.fieldState.email.isVisible ? update_form.formData.email : update_form.sourceData.email}}',
          "gender" = '{{update_form.fieldState.gender.isVisible ? update_form.formData.gender : update_form.sourceData.gender}}'`,
          where: `"id" = {{data_table.selectedRow.id}}`,
        },
        recordsCount: false,
      },
      initialValues,
    );

    expect(expr).toEqual([
      {
        actionTitle: "Update_query",
        actionPayload: {
          body: `UPDATE someTable
SET
  \"email\" = '{{update_form.fieldState.email.isVisible ? update_form.formData.email : update_form.sourceData.email}}',
          \"gender\" = '{{update_form.fieldState.gender.isVisible ? update_form.formData.gender : update_form.sourceData.gender}}'
WHERE
  \"id\" = {{data_table.selectedRow.id}}`,
          pluginSpecifiedTemplates: [{ value: true }],
        },
      },
    ]);
  });
  test("should build insert form data correctly ", () => {
    const expr = PostgreSQL.build(
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
          value: `(
"email",
"gender")
VALUES (
  '{{insert_form.formData.email}}',
  '{{insert_form.formData.gender}}')`,
        },
        recordsCount: false,
      },
      initialValues,
    );
    expect(expr).toEqual([
      {
        actionTitle: "Insert_query",
        actionPayload: {
          body: `INSERT INTO
  someTable (
"email",
"gender")
VALUES (
  '{{insert_form.formData.email}}',
  '{{insert_form.formData.gender}}')`,
          pluginSpecifiedTemplates: [{ value: true }],
        },
      },
    ]);
  });
});
