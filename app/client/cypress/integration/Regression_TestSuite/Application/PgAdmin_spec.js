import * as _ from "../../../support/Objects/ObjectsCore";

const dsl = require("../../../fixtures/PgAdmindsl.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe("PgAdmin Clone App", function() {
  let datasourceName, tableName;

  before("Add dsl and create datasource", () => {
    cy.addDsl(dsl);
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
  });

  it("1. Create queries", function() {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    // clicking on new query to write a query

    _.dataSources.CreateQuery(datasourceName);
    cy.get(queryLocators.queryNameField).type("get_schema");
    // switching off Use Prepared Statement toggle
    _.dataSources.ToggleUsePreparedStatement(false);
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    // writing query to get the schema
    _.dataSources.EnterQuery(
      "SELECT schema_name FROM information_schema.schemata;",
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();

    // clicking on new query to write a query
    _.dataSources.CreateQuery(datasourceName);
    cy.get(queryLocators.queryNameField).type("get_tables");
    cy.get(queryLocators.templateMenu).click();
    // writing query to get all the tables
    _.dataSources.EnterQuery(
      `select *
       from pg_catalog.pg_tables
       where schemaname = {{schema_select.selectedOptionValue || "public"}};`,
      2000,
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();

    // clicking on new query to write a query
    _.dataSources.CreateQuery(datasourceName);
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.get(queryLocators.templateMenu).click();
    // creating query to get the columns of the table
    _.dataSources.EnterQuery(
      `SELECT column_name, data_type, table_name, ordinal_position, is_nullable
       FROM information_schema.COLUMNS`,
    );
    _.dataSources.RunQuery();

    _.dataSources.NavigateToActiveTab();
    _.dataSources.CreateQuery(datasourceName);
    _.agHelper.RenameWithInPane("create_table");
    // switching off Use Prepared Statement toggle
    _.dataSources.ToggleUsePreparedStatement(false);
    cy.get(queryLocators.templateMenu).click();
    // writing query to create new table
    _.dataSources.EnterQuery(
      `CREATE TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll
       (
         " ",
         "_"
       )}}
       (
         {
         {
         appsmith.store.nt_col.map(
       (
         c
       )=> c.name.replaceAll
       (
         " ",
         "_"
       ) + " " + c.dtype +
       (
         c.nnull ? " NOT NULL " : ""
       ) +
       (
         c.pkey ? " PRIMARY KEY " : ""
       )).join
       (
         " , "
       )}})`,
    );
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();

    // clicking on new query to write a query
    _.dataSources.CreateQuery(datasourceName);
    _.agHelper.RenameWithInPane("drop_table");
    cy.get(queryLocators.templateMenu).click();
    // switching off Use Prepared Statement toggle
    _.dataSources.ToggleUsePreparedStatement(false);
    // creating query to delete the table
    _.dataSources.EnterQuery(
      `DROP TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=>c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " :  "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}});`,
    );
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();
  });

  it("2. Add new table from app page, View and Delete table", function() {
    _.deployMode.DeployApp();
    // adding new table
    cy.xpath(appPage.addNewtable).click({ force: true });
    cy.wait(500);
    cy.generateUUID().then((UUID) => {
      cy.xpath(appPage.addTablename)
        .clear()
        .type(`table${UUID}`);
      tableName = `table${UUID}`;
    });
    // adding column to the table
    cy.xpath(appPage.addColumn).click({ force: true });
    cy.xpath(appPage.columnNamefield).should("be.visible");
    cy.xpath(appPage.datatypefield).should("be.visible");
    _.agHelper.GetNClick(appPage.addColumnName);
    _.agHelper.UpdateInput(appPage.addColumnName, "ID");
    _.agHelper.SelectFromDropDown("Varchar", "", 1);
    // switching on the Primary Key toggle
    cy.get(widgetsPage.switchWidgetInactive)
      .first()
      .click();
    // switching on the Not Null toggle
    cy.get(widgetsPage.switchWidgetInactive)
      .last()
      .click();
    cy.xpath(appPage.submitButton).click({ force: true });
    cy.xpath(appPage.addColumn).should("be.visible");
    cy.wait(500);
    cy.xpath(appPage.submitButton)
      .first()
      .click({ force: true });
    cy.xpath(appPage.closeButton).click({ force: true });
    cy.xpath(appPage.addNewtable).should("be.visible");
    // viewing the table's columns by clicking on view button
    cy.xpath(appPage.viewButton)
      .first()
      .click({ force: true });
    // deleting the table through modal
    cy.xpath(appPage.deleteButton)
      .last()
      .click({ force: true });
    cy.xpath(appPage.confirmButton).click({ force: true });
    cy.xpath(appPage.closeButton).click({ force: true });
  });
});
