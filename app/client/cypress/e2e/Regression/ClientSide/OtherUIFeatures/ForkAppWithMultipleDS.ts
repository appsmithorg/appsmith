import {
  agHelper,
  dataSources,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import reconnectDSLocator from "../../../../locators/ReconnectLocators.js";
import formControls from "../../../../locators/FormControl.json";

let workspaceId: string;

describe("Fork application with multiple datasources", function () {
  before(() => {
    // Create Mongo DS and respective query
    dataSources.CreateDataSource("Mongo");
    dataSources.CreateQueryAfterDSSaved("", "GetProduct");
    // Create PostgreSQL DS and respective query
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
    // Create Mysql DS and respective query
    dataSources.CreateDataSource("MySql");
    dataSources.CreateQueryAfterDSSaved("select * from customers limit 10");
    // Create S3 DS
    dataSources.CreateDataSource("S3");
  });

  it("1. Bug Id: 24708  - fork and test the forked application", function () {
    // Create S3 Query
    cy.NavigateToActiveDSQueryPane("S3");
    dataSources.ValidateNSelectDropdown("Commands", "List files in bucket");
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    dataSources.RunQuery({ toValidateResponse: false });
    // Create a new workspace and fork application
    const appname: string = localStorage.getItem("AppName") || "randomApp";
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = "forkApp" + uid;
      homePage.CreateNewWorkspace(workspaceId);
      agHelper.PressEscape();
      cy.log("------------------" + workspaceId);
      homePage.ForkApplication(appname, workspaceId);
    });
    // In the forked application, reconnect all datasources
    cy.ReconnectDatasource("MongoDB");
    dataSources.FillMongoDatasourceFormWithURI();
    agHelper.GetNClick(dataSources._saveDs);

    cy.ReconnectDatasource("PostgreSQL");
    dataSources.FillPostgresDSForm();
    agHelper.GetNClick(dataSources._saveDs);

    cy.ReconnectDatasource("MySQL");
    dataSources.FillMySqlDSForm();
    agHelper.GetNClick(dataSources._saveDs);

    cy.ReconnectDatasource("S3");
    cy.fillAmazonS3DatasourceForm();
    agHelper.GetNClick(dataSources._saveDs);
    // assert if the datasources are connected as expeced
    agHelper.AssertContains(
      "Your application is ready to use.",
      "exist",
      reconnectDSLocator.SuccessMsg,
    );
    homePage.AssertNCloseImport();
  });
});
