import {
  agHelper,
  dataSources,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

let sourceWorkspaceId: string;
let targetWorkspaceId: string;

describe(
  "Fork application with multiple datasources",
  {
    tags: ["@tag.Fork", "@tag.Datasource", "@tag.Git", "@tag.Table", "@tag.JS"],
  },
  function () {
    it("1. Bug Id: 24708  - fork and test the forked application", function () {
      // Create a new workspace and fork application
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        sourceWorkspaceId = "source-" + uid;
        homePage.CreateNewWorkspace(sourceWorkspaceId, true);
        agHelper.PressEscape();
        homePage.CreateAppInWorkspace(sourceWorkspaceId);
        // Create Mongo DS and respective query
        dataSources.CreateDataSource("Mongo");
        dataSources.CreateQueryAfterDSSaved();
        // Create PostgreSQL DS and respective query
        dataSources.CreateDataSource("Postgres");
        dataSources.CreateQueryAfterDSSaved();
        // Create Mysql DS and respective query
        dataSources.CreateDataSource("MySql");
        dataSources.CreateQueryAfterDSSaved();
        // Create S3 DS
        dataSources.CreateDataSource("S3");
        dataSources.CreateQueryAfterDSSaved();
        dataSources.ValidateNSelectDropdown("Command", "List files in bucket");
        agHelper.EnterValue("assets-test.appsmith.com", {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Bucket name",
        });
      });
      homePage.NavigateToHome();
      const appname: string = localStorage.getItem("appName") || "randomApp";
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        targetWorkspaceId = "forkApp" + uid;
        homePage.CreateNewWorkspace(targetWorkspaceId, true);
        agHelper.PressEscape();
        homePage.SelectWorkspace(sourceWorkspaceId);
        homePage.ForkApplication(appname, targetWorkspaceId);
      });
      // In the forked application, reconnect all datasources
      dataSources.ReconnectDSbyType("MongoDBUri");
      dataSources.ReconnectDSbyType("PostgreSQL");
      dataSources.ReconnectDSbyType("MySQL");
      dataSources.ReconnectDSbyType("S3");

      // assert if the datasources are connected as expeced
      homePage.AssertNCloseImport();
    });
  },
);
