const dsl = require("../../../../fixtures/listButtonDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Bind list widget with button widget and validate usecases", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate for Debug error msg after undo action", function() {
    cy.SearchEntityandOpen("Button1");
    cy.testCodeMirrorContains("{{asdasfasf}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".t--debugger svg").click({ force: true });
    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(4000);
    cy.get(".debugger-message").should(
      "have.text",
      "ReferenceError: asdasfasf is not defined",
    );
  });
});
