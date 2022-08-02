import apiEditor from "../../../../locators/apiWidgetslocator.json";

let appName = "";
let datasourceName = "GraphQL_DS_";
let apiName = "GraphQL_API_";

describe("GraphQL Datasource Implementation", function() {
  before(() => {
    appName = localStorage.getItem("AppName");
    cy.generateUUID().then((uid) => {
      datasourceName = `${datasourceName}${uid}`;
      apiName = `${apiName}${uid}`;
    });
  });

  it("1. Should create the Graphql datasource with Credentials", function() {
    cy.createGraphqlDatasource(datasourceName);
    cy.deleteDatasource(datasourceName);
  });

  it("2. Should create an GraphQL API with updated name", function() {
    cy.createGraphqlDatasource(datasourceName);
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
    cy.wait(1000);
  });

  after(() => {
    cy.NavigateToHome();
    cy.DeleteApp(appName);
  });
});
