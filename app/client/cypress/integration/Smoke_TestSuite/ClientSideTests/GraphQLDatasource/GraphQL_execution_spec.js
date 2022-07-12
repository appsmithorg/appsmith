import apiEditorLocators from "../../../../locators/ApiEditor.js";

let appName = "";
let datasourceName = "GraphQL_DS_";

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
    appName = localStorage.getItem("AppName");
    cy.generateUUID().then((uid) => {
      datasourceName = `${datasourceName}${uid}`;
      cy.createGraphqlDatasource(datasourceName);
    });
  });

  it("1. Should execute the API and validate the response", function() {
    /* Create an API */
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(apiEditor.graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_QUERY);

    cy.get(apiEditor.graphqlVariableEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_VARIABLES);

    cy.wait(500);

    cy.RunAPI().should(
      "have.nested.property",
      "response.body.data.body.data.capsule.id",
      CAPSULE_ID,
    );
  });

  it("2. Pagination for limit based should work without offset", function() {
    /* Create an API */
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(apiEditorLocators.graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_LIMIT_QUERY);

    // Change tab to Pagination tab
    cy.get(apiEditorLocators.apiTab)
      .contains("Pagination")
      .click({ force: true });

    // Select Limit base Pagination
    cy.get(`${apiEditorLocators.apiPaginationTab} label`)
      .eq(1)
      .click({ force: true });

    // Select Limit Variable from dropdown
    cy.get(apiEditorLocators.graphqlPagination.limitVariable).click({
      force: true,
    });
    cy.get(apiEditorLocators.graphqlPagination.limitVariable)
      .contains("limit")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(apiEditorLocators.graphqlPagination.limitValue)
      .first()
      .focus()
      .type("1");

    cy.wait(500);

    cy.RunAPI().should(
      "have.nested.property",
      "response.body.data.body.data.launchesPast[0].mission_name",
      GRAPHQL_LIMIT_DATA[0].mission_name,
    );
  });

  it("3. Pagination for limit based should work with offset", function() {
    /* Create an API */
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(apiEditorLocators.graphqlQueryEditor)
      .first()
      .focus()
      .type("{selectAll}{backspace}", { force: true })
      .type("{backspace}", { force: true })
      .type(GRAPHQL_LIMIT_QUERY);

    // Change tab to Pagination tab
    cy.get(apiEditorLocators.apiTab)
      .contains("Pagination")
      .click({ force: true });

    // Select Limit base Pagination
    cy.get(`${apiEditorLocators.apiPaginationTab} label`)
      .eq(1)
      .click({ force: true });

    // Select Limit Variable from dropdown
    cy.get(apiEditorLocators.graphqlPagination.limitVariable).click({
      force: true,
    });
    cy.get(apiEditorLocators.graphqlPagination.limitVariable)
      .contains("limit")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(apiEditorLocators.graphqlPagination.limitValue)
      .first()
      .focus()
      .type("1");

    // Select Offset Variable from dropdown
    cy.get(apiEditorLocators.graphqlPagination.offsetVariable).click({
      force: true,
    });
    cy.get(apiEditorLocators.graphqlPagination.offsetVariable)
      .contains("offset")
      .click({ force: true });

    // Set the Limit Value as 1
    cy.get(apiEditorLocators.graphqlPagination.offsetValue)
      .first()
      .focus()
      .type("1");

    cy.wait(500);

    cy.RunAPI().should(
      "have.nested.property",
      "response.body.data.body.data.launchesPast[0].mission_name",
      GRAPHQL_LIMIT_DATA[1].mission_name,
    );
  });

  after(() => {
    cy.NavigateToHome();
    cy.DeleteApp(appName);
  });
});
