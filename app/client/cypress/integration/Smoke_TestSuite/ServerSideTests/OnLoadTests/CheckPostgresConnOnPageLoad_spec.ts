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
    agHelper.RenameWithInPane("CreateUser");
    const userCreateQuery = `drop owned by test_conn_user; drop user test_conn_user;
      create user test_conn_user with password 'password';
      grant select, insert, update, delete on all tables in schema public TO test_conn_user;`;
    dataSources.EnterQuery(userCreateQuery);
    cy.get(".CodeMirror textarea").focus();
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });
  });

  it("3. Create new datasource for user test_conn_user", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane("Postgres " + guid, false);
      dataSources.FillPostgresDSForm(false, "test_conn_user", "password");
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres " + guid).as("dsName");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
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
});
