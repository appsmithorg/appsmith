import { ObjectsRegistry } from "../../support/Objects/Registry";

let guid: any, dsName_1: any, dsName_2: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
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
      agHelper.RenameWithInPane("Postgres_1_ " + guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres_1_ " + guid).as("dsName_1");
      cy.get("@dsName_1").then(($dsName) => {
        dsName_1 = $dsName;
      });
    });
  });

  it("2. Run create new user query", () => {
    ee.CreateNewDsQuery(dsName_1);
    //dataSources.NavigateFromActiveDS(dsName_1, true);
    //agHelper.GetNClick(dataSources._templateMenu);
    // agHelper.RenameWithInPane("create_user");
    // const userName = "test_conn_user_" + guid;
    // const userCreateQuery =
    //   `create user ` +
    //   userName +
    //   ` with password 'password';
    //   grant select, insert, update, delete on all tables in schema public to ` +
    //   userName +
    //   `;`;
    // dataSources.EnterQuery(userCreateQuery);
    // cy.get(locator._codeMirrorTextArea).focus();
    // dataSources.RunQuery();
    // dataSources.ReadQueryTableResponse(0).then(($cellData) => {
    //   expect($cellData).to.eq("0");
    // });
  });

  /*it("3. Create new datasource for user test_conn_user", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    agHelper.RenameWithInPane("Postgres_2_ " + guid, false);
    const userName = "test_conn_user_" + guid;
    dataSources.FillPostgresDSForm(false, userName, "password");
    dataSources.TestSaveDatasource();

    cy.wrap("Postgres_2_ " + guid).as("dsName_2");
    cy.get("@dsName_2").then(($dsName) => {
      dsName_2 = $dsName;
    });
  });*/

  /*it("4. Create 10 queries", () => {
    for (let i = 0; i < 3; i++) {
      dataSources.NavigateFromActiveDS(dsName_2, true);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("Query_" + i);
      const userCreateQuery = `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';`;
      dataSources.EnterQuery(userCreateQuery);
    }
  });*/

  /*it("5. Bind queries to text widget", () => {
    for (let i = 0; i < 10; i++) {
      ee.DragDropWidgetNVerify("textwidget", i * 50 + 100, i * 50 + 250);
      propPane.UpdatePropertyFieldValue("Text", "{{Query_" + i + ".data}}");
      agHelper.ValidateNetworkStatus("@updateLayout", 200);
    }
  });

  it("6. Run query to drop any open connections before deploy and then deploy app", () => {
    dataSources.NavigateFromActiveDS(dsName_1, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("check_number_of_connections_1");
    const userName = "test_conn_user_" + guid;
    const dropConnections =
      `select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.usename = '` +
      userName +
      `'`;
    dataSources.EnterQuery(dropConnections);
    cy.get(locator._codeMirrorTextArea).focus();
    dataSources.RunQuery();
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='` + userName + `'`;
    dataSources.EnterQuery(checkNoOfConnQuery);
    cy.get(locator._codeMirrorTextArea).focus();
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    deployMode.DeployApp();
    agHelper.Sleep(10000);
    deployMode.NavigateBacktoEditor();
  });

  it("7. Run query to check number of open connections after deploy", () => {
    dataSources.NavigateFromActiveDS(dsName_2, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("check_number_of_connections_2");
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='test_conn_user_` +
      guid +
      `'`;
    dataSources.EnterQuery(checkNoOfConnQuery);
    cy.get(locator._codeMirrorTextArea).focus();
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.lte(5);
    });
  });*/
});
