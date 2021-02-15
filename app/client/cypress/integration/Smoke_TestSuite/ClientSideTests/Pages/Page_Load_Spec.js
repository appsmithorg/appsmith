const dsl = require("../../../fixtures/PageLoadDsl.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("Page Load tests", () => {
  before(() => {
    cy.addDsl(dsl);
    cy.get("div")
      .contains("Pages")
      .next()
      .click();
    cy.get("h2").contains("Drag and drop a widget here");
    cy.addDsl(dsl);
  });
  it("Published page loads correctly", () => {
    // Update the text to be asserted later
    cy.openPropertyPane("textwidget");
    cy.testCodeMirror("This is Page 2");
    // Publish
    cy.PublishtheApp();
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    // Test after reload
    cy.reload();
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    // Switch page
    cy.get(".t--page-switch-tab")
      .contains("Page1")
      .click({ force: true });
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page1")
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
  });
});
