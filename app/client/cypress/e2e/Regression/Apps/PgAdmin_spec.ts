import {
  agHelper,
  deployMode,
  dataSources,
  assertHelper,
  locators,
  draggableWidgets,
} from "../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe(
  "PgAdmin Clone App",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let datasourceName, tableName;

    before("Add dsl and create datasource", () => {
      agHelper.AddDsl("PgAdmindsl");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
    });

    it("1. Create queries", function () {
      // writing query to get all schema
      dataSources.CreateQueryAfterDSSaved(
        "SELECT schema_name FROM information_schema.schemata;",
        "get_schema",
      );
      // switching off Use Prepared Statement toggle
      dataSources.ToggleUsePreparedStatement(false);
      dataSources.RunQuery();

      // writing query to get all the tables
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `select * from pg_catalog.pg_tables where schemaname = {{schema_select.selectedOptionValue || "public"}};`,
        "get_tables",
        2000,
      );
      dataSources.RunQuery();

      // writing query to get all the columns
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT column_name, data_type, table_name, ordinal_position, is_nullable FROM information_schema.COLUMNS`,
        "get_columns",
      );
      dataSources.RunQuery();

      // writing query to get create table
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `CREATE TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=> c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " : "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}})`,
        "create_table",
      );
      dataSources.ToggleUsePreparedStatement(false);

      // writing query to get drop table
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `DROP TABLE {{schema_select.selectedOptionValue}}.{{nt_name.text.replaceAll(" ","_")}}({{appsmith.store.nt_col.map((c)=>c.name.replaceAll(" ","_") + " " + c.dtype + (c.nnull ? " NOT NULL " :  "") + (c.pkey ? " PRIMARY KEY " : "")).join(" , ")}});`,
        "drop_table",
      );
    });

    it("2. Add new table from app page, View and Delete table", function () {
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      // adding new table
      agHelper.GetNClick(appPage.addNewtable, 0, true);
      agHelper.AssertElementAbsence(appPage.loadButton, 40000); //for CI
      agHelper.WaitUntilEleAppear(appPage.addTablename);
      cy.generateUUID().then((UUID) => {
        cy.xpath(appPage.addTablename).clear().type(`table${UUID}`);
        tableName = `table${UUID}`;
      });
      // adding column to the table
      cy.xpath(appPage.addColumn).click({ force: true });
      cy.xpath(appPage.columnNamefield).should("be.visible");
      cy.xpath(appPage.datatypefield).should("be.visible");
      agHelper.GetNClick(appPage.addColumnName);
      agHelper.TypeText(
        appPage.addColumnName + " " + locators._inputField,
        "ID",
      );
      agHelper.SelectFromDropDown("Varchar", "", 1);
      // switching on the Primary Key toggle
      cy.get(widgetsPage.switchWidgetInactive).first().click();
      // switching on the Not Null toggle
      cy.get(widgetsPage.switchWidgetInactive).last().click();
      cy.xpath(appPage.submitButton).click({ force: true });
      agHelper.AssertElementVisibility(appPage.addColumn);
      cy.xpath(appPage.submitButton).first().click({ force: true });
      assertHelper.AssertNetworkStatus("@postExecute");
      cy.xpath(appPage.closeButton).click({ force: true });
      cy.xpath(appPage.addNewtable).should("be.visible");
      // viewing the table's columns by clicking on view button
      cy.xpath(appPage.viewButton).first().click({ force: true });
      // deleting the table through modal
      cy.xpath(appPage.deleteButton).last().click({ force: true });
      cy.xpath(appPage.confirmButton).click({ force: true });
      cy.xpath(appPage.closeButton).click({ force: true });
    });
  },
);
