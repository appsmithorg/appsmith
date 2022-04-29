import explorer from "../../../../locators/explorerlocators.json";
import pages from "../../../../locators/Pages.json";
import apiEditor from "../../../../locators/apiWidgetslocator.json";
import datasource from "../../../../locators/DatasourcesEditor.json";
import queryLocators from "../../../../locators/QueryEditor.json";
let organisationName = "GraphQL_";
let datasourceName = "GraphQL_DS_";
let apiName = "GraphQL_API_";

describe("GraphQL Datasource Implementation", function() {
  before(() => {
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
    cy.get("input[name='datasourceConfiguration.url']").type(
      "https://api.spacex.land/graphql",
    );

    // Selecting No for Authentication property : sendScopeWithRefreshToken
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.sendScopeWithRefreshToken']",
    ).click();
    cy.get(".t--dropdown-option")
      .eq(1)
      .click();

    // Selecting Header for Authentication property : refreshTokenClientCredentialsLocation
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.refreshTokenClientCredentialsLocation']",
    ).click();
    cy.get(".t--dropdown-option")
      .eq(1)
      .click();

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

  after(() => {
    cy.NavigateToHome();
    cy.DeleteApp(organisationName);
    cy.openOrgOptionsPopup(organisationName);
    cy.contains("Delete Organization").click();
    cy.waitFor(1000);
    cy.contains("Are you sure").click();
  });
});
