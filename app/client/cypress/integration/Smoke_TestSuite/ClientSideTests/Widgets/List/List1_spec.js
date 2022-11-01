const dsl = require("../../../../../fixtures/listRegressionDsl.json");

describe("Binding the list widget with text widget", function() {
  //const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  it("1. Validate delete widget action from side bar", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("listwidget");
    cy.verifyUpdatedWidgetName("Test");
    cy.verifyUpdatedWidgetName("#$%1234", "___1234");
    cy.verifyUpdatedWidgetName("56789");
    cy.get(".t--delete-widget").click({ force: true });
    cy.get(".t--toast-action span")
      .eq(0)
      .contains("56789 is removed");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.reload();
    //cy.get(commonlocators.homeIcon).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
  });
});
