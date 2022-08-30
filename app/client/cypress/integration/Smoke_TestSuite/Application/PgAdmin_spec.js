import homePage from "../../../locators/HomePage";
const dsl = require("../../../fixtures/PgAdmindsl.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe("PgAdmin Clone App", function() {
  let workspaceId;
  let newWorkspaceName;
  let appname;
  let datasourceName;

  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Add dsl and authenticate datasource", function() {
    // authenticating datasource
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Create queries", function() {
    cy.NavigateToQueryEditor();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_schema");
    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    // writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT schema_name FROM information_schema.schemata;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
    // clicking on chevron icon to go back to the datasources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_tables");
    cy.get(queryLocators.templateMenu).click();
    // writing query to get all the tables
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        'select * from pg_catalog.pg_tables where schemaname = {{schema_select.selectedOptionValue || "public"}} ;',
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();
    cy.runQuery();
    // clicking on chevron icon to go back to the datasources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.get(queryLocators.templateMenu).click();
    // creating query to get the columns of the table
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        "SELECT column_name, data_type, table_name, ordinal_position, is_nullable FROM information_schema.COLUMNS",
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();
    cy.runQuery();
    // clicking on chevron icon to go back to the datasources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("create_table");
    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    // writing query to create new table
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        'CREATE TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=>c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " :  "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}})',
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();
    cy.runQuery();
    // clicking on chevron icon to go back to the datasources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("drop_table");
    cy.get(queryLocators.templateMenu).click();
    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    // creating query to delete the table
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        "DROP TABLE {{schema_select.selectedOptionValue}}.{{List1.selectedItem.tablename}};",
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();
    cy.runQuery();
    // clicking on chevron icon to go back to the datasources page
    cy.get(appPage.dropdownChevronLeft).click();
  });

  it("Add new table", function() {
    const uuid = () => Cypress._.random(0, 1e6);
    const id = uuid();
    const Table = `table${id}`;
    // clicking on chevron to go back to the application page
    cy.get(appPage.dropdownChevronLeft).click();
    // adding new table
    cy.xpath(appPage.addNewtable).click();
    cy.xpath(appPage.addTablename)
      .clear()
      .type(Table);
    // adding column to the table
    cy.xpath(appPage.addColumn).click();
    cy.xpath(appPage.columnNamefield).should("be.visible");
    cy.xpath(appPage.datatypefield).should("be.visible");
    cy.xpath(appPage.addTablename).type("id");
    cy.get(appPage.dropdownChevronDown)
      .last()
      .click();
    cy.xpath(appPage.selectDatatype).click();
    // switching on the Primary Key toggle
    cy.get(widgetsPage.switchWidgetInactive)
      .first()
      .click();
    // switching on the Not Null toggle
    cy.get(widgetsPage.switchWidgetInactive)
      .last()
      .click();
    cy.xpath(appPage.submitButton).click();
    cy.xpath(appPage.addColumn).should("be.visible");
    cy.xpath(appPage.submitButton).click({ force: true });
    cy.xpath(appPage.closeButton).click();
  });

  it("View and Delete table", function() {
    cy.xpath(appPage.addNewtable).should("be.visible");
    // viewing the table's columns by clicking on view button
    cy.xpath(appPage.viewButton)
      .first()
      .click({ force: true });
    // deleting the table through modal
    cy.xpath(appPage.deleteButton)
      .last()
      .click({ force: true });
    cy.xpath(appPage.confirmButton).click();
    cy.xpath(appPage.closeButton).click();
  });
});
