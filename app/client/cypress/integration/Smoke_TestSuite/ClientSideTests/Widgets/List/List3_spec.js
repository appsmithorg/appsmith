const dsl = require("../../../../../fixtures/listRegression3Dsl.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Binding the list widget with text widget", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate text widget data based on changes in list widget Data3", function() {
    cy.PublishtheApp();
    cy.wait(5000);
    cy.get(".t--widget-textwidget span:contains('Vivek')").should(
      "have.length",
      2,
    );
    cy.get(".t--widget-textwidget span:contains('pawan')").should(
      "have.length",
      2,
    );
    cy.get(publish.backToEditor).click({ force: true });
    cy.get(".t--text-widget-container:contains('Vivek')").should(
      "have.length",
      2,
    );
    cy.get(".t--text-widget-container:contains('pawan')").should(
      "have.length",
      2,
    );
  });
});
