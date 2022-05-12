const dsl = require("../../../../fixtures/listTextDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the list widget with text widget", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate debug message with special chars as part of text label", function() {
    cy.SearchEntityandOpen("Text3");
    cy.testCodeMirror("Yesterday's");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".t--evaluatedPopup-error").should(
      "have.text",
      "SyntaxError: Unexpected identifier",
    );
    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
