import apiEditor from "../../../../locators/apiWidgetslocator.json";
import datasource from "../../../../locators/DatasourcesEditor.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer;
let organisationName = "GraphQL_";
let datasourceName = "GraphQL_DS_";
let apiName = "GraphQL_API_";

const GRAPHQL_URL = "https://api.spacex.land/graphql";
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

describe("GraphQL Datasource Implementation", function() {
  before(() => {
    // cy.get(commonlocators.homeIcon).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    // cy.wait(3000);
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.generateUUID().then((uid) => {
        organisationName = `${organisationName}${uid}`;
        datasourceName = `${datasourceName}${uid}`;
        apiName = `${apiName}${uid}`;
        cy.renameOrg(newOrganizationName, organisationName);
        cy.CreateAppForOrg(organisationName, organisationName);
      });
    });
  });

  it("1. Should create the Graphql datasource with Credentials", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(apiEditor.createBlankApiGraphQL).click({ force: true });

    // Updating the name of datasource
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(datasourceName, { force: true })
      .should("have.value", datasourceName)
      .blur();

    // Adding Graphql Url
    cy.get("input[name='datasourceConfiguration.url']").type(GRAPHQL_URL);

    cy.get(datasource.saveBtn).click({ force: true });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("2. Should create an GraphQL API with updated name", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get(apiEditor.apiTxt)
      .clear()
      .type(apiName, { force: true })
      .should("have.value", apiName)
      .blur();
  });

  it("3. Should execute the API and validate the response", function() {
    ee.SelectEntityByName(apiName, "QUERIES/JS");
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

    // cy.get(ApiEditor.ApiRunBtn).click({ force: true });
    // cy.wait("@postExecute");
    cy.RunAPI().should(
      "have.nested.property",
      "response.body.data.body.data.capsule.id",
      CAPSULE_ID,
    );
  });

  after(() => {
    cy.NavigateToHome();
    cy.DeleteApp(organisationName);
    cy.openOrgOptionsPopup(organisationName);
    cy.contains("Delete Organization").click();
    cy.waitFor(1000);
    cy.contains("Are you sure").click();
  });
});
