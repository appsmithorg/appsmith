import * as _ from "../../../support/Objects/ObjectsCore";

const dsl = require("../../../fixtures/PgAdmindsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe("PgAdmin Clone App", function () {
  let datasourceName, tableName;

  before("Add dsl and create datasource", () => {
    cy.addDsl(dsl);
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
  });

  it("1. Create queries", function () {
    // writing query to get all schema
    _.dataSources.CreateQueryAfterDSSaved(
      "SELECT schema_name FROM information_schema.schemata;",
      "get_schema",
    );
    // switching off Use Prepared Statement toggle
    _.dataSources.ToggleUsePreparedStatement(false);
    _.dataSources.RunQuery();

    // writing query to get all the tables
    _.dataSources.CreateQueryFromOverlay(
      datasourceName,
      `select * from pg_catalog.pg_tables where schemaname = {{schema_select.selectedOptionValue || "public"}};`,
      "get_tables",
      2000,
    );
    _.dataSources.RunQuery();

    // writing query to get all the columns
    _.dataSources.CreateQueryFromOverlay(
      datasourceName,
      `SELECT column_name, data_type, table_name, ordinal_position, is_nullable FROM information_schema.COLUMNS`,
      "get_columns",
    );
    _.dataSources.RunQuery();

    // writing query to get create table
    _.dataSources.CreateQueryFromOverlay(
      datasourceName,
      `CREATE TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=> c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " : "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}})`,
      "create_table",
    );
    _.dataSources.ToggleUsePreparedStatement(false);

    // writing query to get drop table
    _.dataSources.CreateQueryFromOverlay(
      datasourceName,
      `DROP TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=>c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " :  "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}});`,
      "drop_table",
    );
  });

  it("2. Add new table from app page, View and Delete table", function () {
    _.deployMode.DeployApp();
    // adding new table
    cy.xpath(appPage.addNewtable).click({ force: true });
    cy.wait(500);
    cy.generateUUID().then((UUID) => {
      cy.xpath(appPage.addTablename).clear().type(`table${UUID}`);
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
    cy.get(widgetsPage.switchWidgetInactive).first().click();
    // switching on the Not Null toggle
    cy.get(widgetsPage.switchWidgetInactive).last().click();
    cy.xpath(appPage.submitButton).click({ force: true });
    cy.xpath(appPage.addColumn).should("be.visible");
    cy.wait(500);
    cy.xpath(appPage.submitButton).first().click({ force: true });
    cy.xpath(appPage.closeButton).click({ force: true });
    cy.xpath(appPage.addNewtable).should("be.visible");
    // viewing the table's columns by clicking on view button
    cy.xpath(appPage.viewButton).first().click({ force: true });
    // deleting the table through modal
    cy.xpath(appPage.deleteButton).last().click({ force: true });
    cy.xpath(appPage.confirmButton).click({ force: true });
    cy.xpath(appPage.closeButton).click({ force: true });
  });
});
