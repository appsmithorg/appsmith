import {
  agHelper,
  dataSources,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

const datasourceLocators = require("../../../../locators/DatasourcesEditor.json");
const formControls = require("../../../../locators/FormControl.json");

let workspaceId: string, datasourceName: string;

describe("Bug Id: 24708 - Fork application with multiple datasources", function () {
  before(() => {
    cy.fixture("mongoAppdsl").then((val) => {
      agHelper.AddDsl(val);
    });

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
    cy.NavigateToDatasourceEditor();
    agHelper.GetNClick(datasourceLocators.AmazonS3);
    cy.generateUUID().then((uid) => {
      datasourceName = `S3 DS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
      cy.fillAmazonS3DatasourceForm();
      cy.testSaveDatasource();
    });
  });

  it("1. Add datasource - Mongo, Postgres, fork and test the forked application", function () {
    // Create S3 Query
    cy.NavigateToActiveDSQueryPane(datasourceName);
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
      '[kind="heading-m"]',
    );
    homePage.AssertNCloseImport();
  });
});
