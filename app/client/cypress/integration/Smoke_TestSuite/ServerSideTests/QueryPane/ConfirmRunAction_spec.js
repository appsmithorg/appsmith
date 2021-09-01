const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
let datasourceName;

describe("Confirm run action", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  beforeEach(() => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Confirm run action", () => {
    cy.NavigateToQueryEditor();

    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy=confirmBeforeExecute]")
      .find(".bp3-switch")
      .click();

    cy.get(queryEditor.runQuery).click();
    cy.get(".bp3-dialog")
      .find(".bp3-button")
      .contains("Confirm")
      .click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.deleteDatasource(datasourceName);
  });
});
