import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any, newCallsign: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  deployMode = ObjectsRegistry.DeployMode;

describe("Test Postgres number of connections on page load", function() {
  before(() => {
    dataSources.StartDataSourceRoutes();
  });

  it("1. Create DS", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane("Postgres " + guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres " + guid).as("dsName");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });
  });

  it("2. Run create new user query", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("create_user");
    const userName = "test_conn_user_" + guid;
    const userCreateQuery =
      `create user ` +
      userName +
      ` with password 'password';
      grant select, insert, update, delete on all tables in schema public TO ` +
      userName +
      `;`;
    dataSources.EnterQuery(userCreateQuery);
    cy.get(".CodeMirror textarea").focus();
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });
  });

  it("3. Create new datasource for user test_conn_user", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    agHelper.RenameWithInPane("Postgres_2_ " + guid, false);
    const userName = "test_conn_user_" + guid;
    dataSources.FillPostgresDSForm(false, userName, "password");
    dataSources.TestSaveDatasource();

    cy.wrap("Postgres_2_ " + guid).as("dsName");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("4. Create 10 queries", () => {
    for (let i = 0; i < 10; i++) {
      dataSources.NavigateFromActiveDS(dsName, true);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("Query_" + i);
      const userCreateQuery = `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';`;
      dataSources.EnterQuery(userCreateQuery);
    }
  });

  it("5. Bind queries to text widget and deploy app", () => {
    for (let i = 0; i < 10; i++) {
      ee.DragDropWidgetNVerify("textwidget", i * 50 + 100, i * 50 + 250);
      propPane.UpdatePropertyFieldValue("Text", "{{Query_" + i + ".data}}");
      agHelper.ValidateNetworkStatus("@updateLayout", 200);
    }
    deployMode.DeployApp();
    agHelper.Sleep(10000);
    deployMode.NavigateBacktoEditor();
  });

  it("6. Run query to check number of open connections to Postgres db", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("check_number_of_connections");
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='test_conn_user_` +
      guid +
      `'`;
    dataSources.EnterQuery(checkNoOfConnQuery);
    cy.get(".CodeMirror textarea").focus();
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.lte(5);
    });
  });
});
