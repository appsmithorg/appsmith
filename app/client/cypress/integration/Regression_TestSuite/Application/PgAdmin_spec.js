import * as _ from "../../../support/Objects/ObjectsCore";
const dsl = require("../../../fixtures/PgAdmindsl.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe("PgAdmin Clone App", function() {
  let datasourceName;

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Add dsl and authenticate datasource", function() {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
  });

  it("2. Create queries", function() {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
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
    _.dataSources.EnterQuery(
      "SELECT schema_name FROM information_schema.schemata;",
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_tables");
    cy.get(queryLocators.templateMenu).click();
    // writing query to get all the tables
    _.dataSources.EnterQuery(
      `select * from pg_catalog.pg_tables where schemaname = {{schema_select.selectedOptionValue || "public"}} ;`,
      2000,
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();
    // clicking on new query to write a query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.get(queryLocators.templateMenu).click();
    // creating query to get the columns of the table
    _.dataSources.EnterQuery(
      `SELECT column_name, data_type, table_name, ordinal_position, is_nullable FROM information_schema.COLUMNS`,
    );
    _.dataSources.RunQuery();
    _.ee.SelectEntityByName("Page1", "Pages");
    _.agHelper.GetNClick(appPage.viewButton, 0, true);
    // adding new table
    _.agHelper.GetNClick(appPage.addNewtable, 0, true);
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      cy.xpath(appPage.addTablename)
        .clear()
        .type(`table${uid}`);
    });
    // adding column to the table
    _.agHelper.GetNClick(appPage.addColumn, 0, true);
    _.agHelper.AssertElementVisible(appPage.columnNamefield);
    _.agHelper.AssertElementVisible(appPage.datatypefield);
    cy.xpath(appPage.addTablename)
      .click()
      .type("id");
    cy.get(appPage.dropdownChevronDown)
      .last()
      .click();
    _.agHelper.GetNClick(appPage.selectDatatype);
    // switching on the Not Null toggle
    cy.get(widgetsPage.switchWidgetInactive)
      .last()
      .click();
    _.agHelper.GetNClick(appPage.submitButton, 0, true);
    _.agHelper.AssertElementVisible(appPage.addColumn);
    _.agHelper.GetNClick(appPage.closeButton, 0, true);
    _.dataSources.NavigateToActiveTab();

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

    _.dataSources.EnterQuery(
      `CREATE TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=>c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " :  "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}})`,
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
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
    _.dataSources.EnterQuery(
      `DROP TABLE {{schema_select.selectedOptionValue}}.{{List1.selectedItem.tablename}};`,
    );
    _.dataSources.RunQuery();
    // clicking on chevron icon to go back to the _.dataSources page
    cy.get(appPage.dropdownChevronLeft).click();
  });

  it("3. Add new table", function() {
    // clicking on chevron to go back to the application page
    cy.get(appPage.dropdownChevronLeft).click();
    // adding new table
    cy.xpath(appPage.addNewtable).click({ force: true });
    cy.wait(500);
    cy.generateUUID().then((UUID) => {
      cy.xpath(appPage.addTablename)
        .clear()
        .type(`table${UUID}`);
    });
    // adding column to the table
    cy.xpath(appPage.addColumn).click({ force: true });
    cy.xpath(appPage.columnNamefield).should("be.visible");
    cy.xpath(appPage.datatypefield).should("be.visible");
    cy.xpath(appPage.addTablename).type("id2");
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
    cy.xpath(appPage.submitButton).click({ force: true });
    cy.xpath(appPage.addColumn).should("be.visible");
    cy.wait(500);
    cy.xpath(appPage.submitButton)
      .first()
      .click({ force: true });
    cy.xpath(appPage.closeButton).click({ force: true });
  });

  it("4.View and Delete table", function() {
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
