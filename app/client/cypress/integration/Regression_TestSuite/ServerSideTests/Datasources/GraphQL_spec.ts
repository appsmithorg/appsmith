import * as _ from "../../../../support/Objects/ObjectsCore";

let appName: string = "";
let datasourceName: string = "GraphQL_DS_";
let apiName: string = "GraphQL_API_";

const GRAPHQL_QUERY = `
  query($id: ID!) {
    capsule(id: $id) {
      id
      status
      type
      landings
`;

const CAPSULE_ID = "5e9e2c5bf35918ed873b2664"

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
    mission_name: "FalconSat",
  },
  {
    mission_name: "DemoSat",
  },
];

describe("GraphQL Datasource Implementation", function() {
  before(() => {
    appName = localStorage.getItem("AppName") || "";
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      datasourceName = `${datasourceName}${uid}`;
      apiName = `${apiName}${uid}`;
    });
  });

  it("1. Should create the Graphql datasource with Credentials", function() {
    // Navigate to Datasource Editor
    _.dataSources.CreateGraphqlDatasource(datasourceName);
    _.dataSources.DeleteDatasouceFromActiveTab(datasourceName);
  });

  it("2. Should create an GraphQL API with updated name", function() {
    _.dataSources.CreateGraphqlDatasource(datasourceName);
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.agHelper.ValidateNetworkStatus("@createNewApi", 201);
    _.agHelper.RenameWithInPane(apiName, true);
  });

  it("3. Should execute the API and validate the response", function() {
    /* Create an API */
    _.dataSources.NavigateFromActiveDS(datasourceName, true);

    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_QUERY,
      variable: GRAPHQL_VARIABLES,
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.capsule.id",
      expectedRes: CAPSULE_ID,
    });
  });

  it("4. Pagination for limit based should work without offset", function() {
    /* Create an API */
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    _.apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    _.apiPage.SelectPaginationTypeViaIndex(1);

    _.dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "limit",
        value: "2",
      },
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[0].mission_name,
    });
  });

  it("5. Pagination for limit based should work with offset", function() {
    /* Create an API */
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    _.apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    _.apiPage.SelectPaginationTypeViaIndex(1);

    _.dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "limit",
        value: "5",
      },
      offset: {
        variable: "offset",
        value: "1",
      },
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[1].mission_name,
    });
  });
});
