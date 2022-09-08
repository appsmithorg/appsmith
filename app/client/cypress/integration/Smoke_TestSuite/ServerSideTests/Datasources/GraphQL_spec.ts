import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let appName: string = "";
let datasourceName: string = "GraphQL_DS_";
let apiName: string = "GraphQL_API_";

let dataSources = ObjectsRegistry.DataSources;
let agHelper = ObjectsRegistry.AggregateHelper;
let homePage = ObjectsRegistry.HomePage;
let apiPage = ObjectsRegistry.ApiPage;

const GRAPHQL_QUERY = `
  query($id: ID!) {
    capsule(id: $id) {
      id
      status
      type
      landings
`;

const CAPSULE_ID = "C105";

const GRAPHQL_VARIABLES = `
  {
    "id": ${CAPSULE_ID}
`;

const GRAPHQL_LIMIT_QUERY = `
  query ($limit: Int, $offset: Int) {
    launchesPast(limit: $limit, offset: $offset) {
      mission_name
      rocket {
        rocket_name
`;

const GRAPHQL_LIMIT_DATA = [
  {
    mission_name: "Starlink-15 (v1.0)",
  },
  {
    mission_name: "Sentinel-6 Michael Freilich",
  },
];

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

  it("3. Should execute the API and validate the response", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);

    dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_QUERY,
      variable: GRAPHQL_VARIABLES,
    });

    apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.capsule.id",
      expectedRes: CAPSULE_ID,
    });
  });

  it("4. Pagination for limit based should work without offset", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);
    dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    apiPage.SelectPaginationTypeViaIndex(1);

    dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "limit",
        value: "1",
      },
    });

    apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[0].mission_name,
    });
  });

  it("5. Pagination for limit based should work with offset", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);

    dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    apiPage.SelectPaginationTypeViaIndex(1);

    dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "limit",
        value: "1",
      },
      offset: {
        variable: "offset",
        value: "1",
      },
    });

    apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[1].mission_name,
    });
  });

  after(() => {
    homePage.NavigateToHome();
  });
});
