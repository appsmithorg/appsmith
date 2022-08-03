import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let datasourceName: string = "GraphQL_DS_";

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
      dataSources.CreateGraphqlDatasource(datasourceName);
    });
  });

  it("1. Should execute the API and validate the response", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);

    cy.get(dataSources._graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_QUERY);

    cy.get(dataSources._graphqlVariableEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_VARIABLES);
      
    cy.wait(1000);

    apiPage.RunAPI("Data", {
      expectedPath: "response.body.data.body.data.capsule.id",
      expectedRes: CAPSULE_ID,
    });
  });

  it("2. Pagination for limit based should work without offset", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);
    cy.get(dataSources._graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_LIMIT_QUERY);

    // Change tab to Pagination tab
    apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    apiPage.SelectPaginationTypeViaIndex(1);

    // Select Limit Variable from dropdown
    cy.get(dataSources._graphqlPagination.limitVariable).click({
      force: true,
    });
    cy.get(dataSources._graphqlPagination.limitVariable)
      .contains("limit")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(dataSources._graphqlPagination.limitValue)
      .first()
      .focus()
      .type("1");

    cy.wait(1000);

    apiPage.RunAPI("Data", {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[0].mission_name,
    });
  });

  it("3. Pagination for limit based should work with offset", function() {
    /* Create an API */
    dataSources.NavigateFromActiveDS(datasourceName, true);

    cy.get(dataSources._graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_LIMIT_QUERY);

    // Change tab to Pagination tab
    apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    apiPage.SelectPaginationTypeViaIndex(1);

    // Select Limit Variable from dropdown
    cy.get(dataSources._graphqlPagination.limitVariable).click({
      force: true,
    });
    cy.get(dataSources._graphqlPagination.limitVariable)
      .contains("limit")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(dataSources._graphqlPagination.limitValue)
      .first()
      .focus()
      .type("1");

    // Select Offset Variable from dropdown
    cy.get(dataSources._graphqlPagination.offsetVariable).click({
      force: true,
    });
    cy.get(dataSources._graphqlPagination.offsetVariable)
      .contains("offset")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(dataSources._graphqlPagination.offsetValue)
      .first()
      .focus()
      .type("1");

    cy.wait(1000);

    apiPage.RunAPI("Data", {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_LIMIT_DATA[1].mission_name,
    });
  });

  after(() => {
    homePage.NavigateToHome();
  });
});
