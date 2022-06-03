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

  it("1. Confirm run action", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy=confirmBeforeExecute]")
      .find("span")
      .click();

    cy.onlyQueryRun();
    cy.get(".bp3-dialog")
      .find("button")
      .contains("Yes")
      .click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.deleteQueryUsingContext();

    cy.deleteDatasource(datasourceName);
  });
});
