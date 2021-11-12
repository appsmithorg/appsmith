const homePage = require("../../../locators/HomePage.json");
const dsl = require("../../../fixtures/PgAdminDsl.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const widgetsPage = require("../../../locators/Widgets.json");

describe("PgAdmin Clone App", function() {
  let orgid;
  let newOrganizationName;
  let appname;
  let datasourceName;

  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Add dsl and authenticate datasource", function() {
    cy.NavigateToHome();
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon)
      .first()
      .click({ force: true });
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
    // get_schema query
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_schema");
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT schema_name FROM information_schema.schemata;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
    // get_tables query
    cy.get(".bp3-icon-chevron-left").click();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_tables");
    cy.get(queryLocators.templateMenu).click();
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
    // get_columns query
    cy.get(".bp3-icon-chevron-left").click();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.get(queryLocators.templateMenu).click();
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
    //  create_table query
    cy.get(".bp3-icon-chevron-left").click();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("create_table");
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
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
    cy.wait(3000);
    cy.WaitAutoSave();
    cy.runQuery();
    // drop_table
    cy.get(".bp3-icon-chevron-left").click();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("drop_table");
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
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
    cy.get(".bp3-icon-chevron-left").click();
  });

  it("Add new table", function() {
    const uuid = () => Cypress._.random(0, 1e6);
    const id = uuid();
    const Table = `table${id}`;
    cy.get(".bp3-icon-chevron-left").click();
    // cy.xpath("//span[text()='public']").click();
    //  cy.xpath("//div[text()='information_schema']").click();
    cy.xpath("//span[text()='New Table']").click();
    cy.xpath("(//div[@class='bp3-input-group']//input)[2]")
      .clear()
      .type(Table);
    cy.wait(2000);
    cy.xpath("//span[text()='Add Column']").click();
    cy.wait(2000);
    cy.xpath("(//div[@class='bp3-input-group']//input)[2]").type("id");
    cy.xpath("//span[text()='Text']").click();
    cy.xpath("//div[text()='Varchar']").click();
    cy.get(widgetsPage.switchWidgetInactive)
      .first()
      .click();
    cy.get(widgetsPage.switchWidgetInactive)
      .last()
      .click();
    cy.xpath("//span[text()='Submit']").click();
    cy.wait(2000);
    cy.xpath("//span[text()='Add Column']").should("be.visible");
    cy.xpath("//span[text()='Submit']").click({ force: true });
    cy.xpath("//span[text()='Close']").click();
  });

  it("View and Delete table", function() {
    cy.xpath("//span[text()='New Table']").should("be.visible");
    //   cy.get(".bp3-icon-chevron-down").click();
    //   cy.xpath("//div[text()='pg_catalog']").click();
    cy.xpath("//span[text()='View']")
      .first()
      .click({ force: true });
    cy.wait(2000);
    cy.get(".bp3-icon-chevron-down").click();
    cy.xpath("//div[text()='information_schema']").click();
    cy.wait(2000);
    cy.xpath("//span[text()='Delete']")
      .last()
      .click({ force: true });
    cy.xpath("//span[text()='Confirm']").click();
    cy.xpath("//span[text()='Close']").click();
  });
});
