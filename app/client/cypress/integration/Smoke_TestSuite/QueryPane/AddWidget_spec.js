const queryLocators = require("../../../locators/QueryEditor.json");
const queryEditor = require("../../../locators/QueryEditor.json");

let datasourceName;

describe("Add widget", function() {
  beforeEach(() => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Add widget", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");

    cy.get(queryEditor.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(".t--add-widget").click();

    cy.SearchEntityandOpen("Table1");
  });
});
