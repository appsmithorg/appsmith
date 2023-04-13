import * as _ from "../../../../support/Objects/ObjectsCore";

let guid: any, dsName_1: any, dsName_2: any;

describe("Test Postgres number of connections on page load + Bug 11572, Bug 11202", function () {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.dataSources.NavigateToDSCreateNew();
      _.dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      _.agHelper.RenameWithInPane("Postgres_1_ " + guid, false);
      _.dataSources.FillPostgresDSForm();
      _.dataSources.TestSaveDatasource();

      cy.wrap("Postgres_1_ " + guid).as("dsName_1");
      cy.get("@dsName_1").then(($dsName) => {
        dsName_1 = $dsName;
      });
    });
  });

  it("1. Run create new user query", () => {
    const userName = "test_conn_user_" + guid;
    const userCreateQuery =
      `create user ` +
      userName +
      ` with password 'password'; grant select, insert, update, delete on all tables in schema public to ` +
      userName +
      `;`;
    _.dataSources.CreateQueryFromOverlay(
      dsName_1,
      userCreateQuery,
      "create_user",
    ); //Creating query from EE overlay
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });
  });

  it("2. Create new datasource for user test_conn_user", () => {
    _.dataSources.NavigateToDSCreateNew();
    _.dataSources.CreatePlugIn("PostgreSQL");
    _.agHelper.RenameWithInPane("Postgres_2_ " + guid, false);
    const userName = "test_conn_user_" + guid;
    _.dataSources.FillPostgresDSForm(false, userName, "password");
    _.dataSources.TestSaveDatasource();

    cy.wrap("Postgres_2_ " + guid).as("dsName_2");
    cy.get("@dsName_2").then(($dsName) => {
      dsName_2 = $dsName;
    });

    //Create 10 queries
    for (let i = 1; i <= 10; i++) {
      _.dataSources.NavigateFromActiveDS(dsName_2, true);
      _.agHelper.GetNClick(_.dataSources._templateMenu);
      _.agHelper.RenameWithInPane("Query_" + i);
      const userCreateQuery = `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';`;
      _.dataSources.EnterQuery(userCreateQuery);
    }
  });

  it.skip("3. Bind queries to select widget", () => {
    for (let i = 1; i <= 10; i++) {
      _.entityExplorer.DragDropWidgetNVerify(
        "selectwidget",
        i * 50 + 50,
        i * 50 + 200,
      );
      _.propPane.UpdatePropertyFieldValue(
        "Options",
        "{{Query_" +
          i +
          ".data.map( (obj) =>{ return  {'label': obj.table_name, 'value': obj.table_name }})}}",
      );
      _.propPane.UpdatePropertyFieldValue(
        "Default Selected Value",
        "{{Query_" + i + ".data[" + (i - 1) + "].table_name}}",
      );
      _.agHelper.ValidateNetworkStatus("@updateLayout", 200);
    }
  });

  it("4. Run query to drop any open connections before deploy and then deploy app", () => {
    _.dataSources.NavigateFromActiveDS(dsName_1, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("check_number_of_connections_1");
    const userName = "test_conn_user_" + guid;
    const dropConnections =
      `select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.usename = '` +
      userName +
      `'`;
    _.dataSources.EnterQuery(dropConnections);
    _.dataSources.RunQuery();
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='` + userName + `'`;
    _.dataSources.EnterQuery(checkNoOfConnQuery);
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    _.deployMode.DeployApp();
    _.agHelper.Sleep(10000);
    _.deployMode.NavigateBacktoEditor();
  });

  it("5. Run query to check number of open connections after deploy", () => {
    _.dataSources.NavigateFromActiveDS(dsName_2, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("check_number_of_connections_2");
    const checkNoOfConnQuery =
      `select count(*) from pg_stat_activity where usename='test_conn_user_` +
      guid +
      `'`;
    _.dataSources.EnterQuery(checkNoOfConnQuery);
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect(Number($cellData)).to.lte(5);
    });
  });

  it("6. Drop the newly created user", () => {
    const userName = "test_conn_user_" + guid;
    const dropUser =
      `DROP OWNED BY ` +
      userName +
      `;
      DROP USER ` +
      userName +
      `;`;
    _.dataSources.CreateQueryFromOverlay(dsName_1, dropUser, "drop_user"); //Creating query from EE overlay
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });

    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  after(
    "Verify Verify Deletion of all created queries & Deletion of datasource",
    () => {
      //Verify Deletion of all created queries
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        "create_user",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "check_number_of_connections_1",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "check_number_of_connections_2",
        "Delete",
        "Are you sure?",
      );

      for (let i = 1; i <= 10; i++) {
        _.entityExplorer.ActionContextMenuByEntityName(
          "Query_" + i,
          "Delete",
          "Are you sure?",
        );
      }

      //Verify deletion of datasource
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName_1, 200);
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName_2, 200);
    },
  );
});
