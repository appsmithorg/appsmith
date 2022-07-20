import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName_1: any, dsName_2: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  deployMode = ObjectsRegistry.DeployMode;

describe("Test Postgres number of connections on page load + Bug 11572, Bug 11202", function() {
  before(() => {
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

  it("1. Run create new user query", () => {
    ee.CreateNewDsQuery(dsName_1);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("create_user");
    const userName = "test_conn_user_" + guid;
    const userCreateQuery =
      `create user ` +
      userName +
      ` with password 'password'; grant select, insert, update, delete on all tables in schema public to ` +
      userName +
      `;`;
    dataSources.EnterQuery(userCreateQuery);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });
  });

  it("2. Create new datasource for user test_conn_user", () => {
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
  });

  it("3. Create 10 queries", () => {
    for (let i = 1; i <= 10; i++) {
      dataSources.NavigateFromActiveDS(dsName_2, true);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("Query_" + i);
      const userCreateQuery = `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';`;
      dataSources.EnterQuery(userCreateQuery);
    }
  });

  it("4. Bind queries to select widget", () => {
    for (let i = 1; i <= 10; i++) {
      ee.DragDropWidgetNVerify("selectwidget", i * 50 + 50, i * 50 + 200);
      propPane.UpdatePropertyFieldValue(
        "Options",
        "{{Query_" +
          i +
          ".data.map( (obj) =>{ return  {'label': obj.table_name, 'value': obj.table_name }})}}",
      );
      propPane.UpdatePropertyFieldValue(
        "Default Value", "{{Query_" + i + ".data[" + (i - 1) + "].table_name}}",
      );
      agHelper.ValidateNetworkStatus("@updateLayout", 200);
    }
  });

  it("5. Run query to drop any open connections before deploy and then deploy app", () => {
    dataSources.NavigateFromActiveDS(dsName_1, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("check_number_of_connections_1");
    const userName = "test_conn_user_" + guid;
    const dropConnections =
      `select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.usename = '` +
      userName +
      `'`;
    dataSources.EnterQuery(dropConnections);
    dataSources.RunQuery();
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='` + userName + `'`;
    dataSources.EnterQuery(checkNoOfConnQuery);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    deployMode.DeployApp();
    agHelper.Sleep(10000);
    deployMode.NavigateBacktoEditor();
  });

  it("6. Run query to check number of open connections after deploy", () => {
    dataSources.NavigateFromActiveDS(dsName_2, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("check_number_of_connections_2");
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='test_conn_user_` +
      guid +
      `'`;
    dataSources.EnterQuery(checkNoOfConnQuery);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.lte(5);
    });
  });

  it("7. Drop the newly created user", () => {
    ee.CreateNewDsQuery(dsName_1);
    agHelper.RenameWithInPane("drop_user");
    agHelper.GetNClick(dataSources._templateMenu);
    const userName = "test_conn_user_" + guid;
    const dropUser = `DROP OWNED BY ` + userName +`;
      DROP USER ` + userName + `;`;
    dataSources.EnterQuery(dropUser);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });

    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("8. Verify Deletion of all created queries", () => {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("create_user", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "check_number_of_connections_1",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("check_number_of_connections_2", "Delete", "Are you sure?");

    for (let i = 1; i <= 10; i++) {
      ee.ActionContextMenuByEntityName("Query_" + i, "Delete", "Are you sure?");
    }
  });

  it("9. Verify Deletion of datasource", () => {
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName_1, 200);
    dataSources.DeleteDatasouceFromWinthinDS(dsName_2, 200);
  });
});
