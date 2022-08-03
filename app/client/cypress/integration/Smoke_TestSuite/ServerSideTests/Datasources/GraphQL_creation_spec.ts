import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let appName: string = "";
let datasourceName: string = "GraphQL_DS_";
let apiName: string = "GraphQL_API_";

let dataSources = ObjectsRegistry.DataSources;
let agHelper = ObjectsRegistry.AggregateHelper;
let homePage = ObjectsRegistry.HomePage;

describe("GraphQL Datasource Implementation", function() {
  before(() => {
    appName = localStorage.getItem("AppName") || "";
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      datasourceName = `${datasourceName}${uid}`;
      apiName = `${apiName}${uid}`;
    });
  });

  it("1. Should create the Graphql datasource with Credentials", function() {
    // Navigate to Datasource Editor
    dataSources.CreateGraphqlDatasource(datasourceName);
    dataSources.DeleteDatasouceFromActiveTab(datasourceName);
  });

  it("2. Should create an GraphQL API with updated name", function() {
    dataSources.CreateGraphqlDatasource(datasourceName);
    dataSources.NavigateFromActiveDS(datasourceName, true);
    agHelper.ValidateNetworkStatus("@createNewApi", 201);
    agHelper.RenameWithInPane(apiName, true);
  });

  after(() => {
    homePage.NavigateToHome();
  });
});
