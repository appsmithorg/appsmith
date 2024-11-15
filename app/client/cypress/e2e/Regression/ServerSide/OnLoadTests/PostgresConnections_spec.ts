import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  dataSources,
  entityItems,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
let guid: any, dsName_1: any, dsName_2: any;

describe(
  "Test Postgres number of connections on page load + Bug 11572, Bug 11202",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid: any) => {
        dataSources.NavigateToDSCreateNew();
        dataSources.CreatePlugIn("PostgreSQL");
        guid = uid.toLowerCase();
        agHelper.RenameWithInPane("Postgres_1_" + guid, false);
        dataSources.FillPostgresDSForm();
        dataSources.TestSaveDatasource();

        cy.wrap("Postgres_1_" + guid).as("dsName_1");
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
      dataSources.CreateQueryFromOverlay(
        dsName_1,
        userCreateQuery,
        "create_user",
      ); //Creating query from EE overlay
      dataSources.RunQuery();
      dataSources.AssertQueryTableResponse(0, "0");
    });

    it("2. Create new datasource for user test_conn_user", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.RenameWithInPane("Postgres_2_" + guid, false);
      const userName = "test_conn_user_" + guid;
      dataSources.FillPostgresDSForm("Production", false, userName, "password");
      dataSources.TestSaveDatasource();

      cy.wrap("Postgres_2_" + guid).as("dsName_2");
      cy.get("@dsName_2").then(($dsName) => {
        dsName_2 = $dsName;

        //Create 10 queries
        for (let i = 1; i <= 8; i++) {
          const userCreateQuery = `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';`;
          dataSources.CreateQueryForDS(dsName_2, userCreateQuery, "Query_" + i);
        }
      });
    });

    it("3. Bind queries to select widget", () => {
      for (let i = 1; i < 8; i++) {
        entityExplorer.DragDropWidgetNVerify(
          "selectwidget",
          i * 1.5 * 50 + 100,
          i * 1.5 * 50 + 50,
        );
        propPane.EnterJSContext(
          "Source Data",
          "{{Query_" +
            i +
            ".data.map( (obj) =>{ return  {'label': obj.table_name, 'value': obj.table_name }})}}",
        );
        propPane.UpdatePropertyFieldValue(
          "Default selected value",
          "{{Query_" + i + ".data[" + (i - 1) + "].table_name}}",
        );
        propPane.EnterJSContext("Value key", "value");
        assertHelper.AssertNetworkStatus("@updateLayout", 200);
      }
    });

    it("4. Run query to drop any open connections before deploy and then deploy app", () => {
      const userName = "test_conn_user_" + guid;
      const dropConnections =
        `select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.usename = '` +
        userName +
        `'`;
      dataSources.CreateQueryForDS(
        dsName_1,
        dropConnections,
        "check_number_of_connections_1",
      );
      dataSources.RunQuery();
      const checkNoOfConnQuery =
        `select count(*) from pg_stat_activity where usename='` +
        userName +
        `'`;
      dataSources.EnterQuery(checkNoOfConnQuery);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
      deployMode.DeployApp();
      agHelper.Sleep(10000);
      deployMode.NavigateBacktoEditor();
    });

    it("5. Run query to check number of open connections after deploy", () => {
      const checkNoOfConnQuery =
        `select count(*) from pg_stat_activity where usename='test_conn_user_` +
        guid +
        `'`;
      dataSources.CreateQueryForDS(
        dsName_2,
        checkNoOfConnQuery,
        "check_number_of_connections_2",
      );
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
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
      dataSources.CreateQueryFromOverlay(dsName_1, dropUser, "drop_user"); //Creating query from EE overlay
      dataSources.RunQuery();
      dataSources.AssertQueryTableResponse(0, "0");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    after(
      "Verify Verify Deletion of all created queries & Deletion of datasource",
      () => {
        //Verify Deletion of all created queries
        AppSidebar.navigate(AppSidebarButton.Editor);
        PageLeftPane.switchSegment(PagePaneSegment.Queries);
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: "create_user",
          action: "Delete",
          entityType: entityItems.Query,
        });
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: "check_number_of_connections_1",
          action: "Delete",
          entityType: entityItems.Query,
        });
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: "check_number_of_connections_2",
          action: "Delete",
          entityType: entityItems.Query,
        });

        for (let i = 1; i <= 8; i++) {
          entityExplorer.ActionContextMenuByEntityName({
            entityNameinLeftSidebar: "Query_" + i,
            action: "Delete",
            entityType: entityItems.Query,
          });
        }

        //Verify deletion of datasource
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName_1, 200);
        dataSources.DeleteDatasourceFromWithinDS(dsName_2, 200);
      },
    );
  },
);
