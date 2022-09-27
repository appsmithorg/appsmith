const dsl = require("../../../../fixtures/PageLoadDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");

describe("Page Load tests", () => {
  before(() => {
    cy.addDsl(dsl);
    cy.get(explorerLocators.AddPage)
      .first()
      .click();

    cy.skipGenerateCRUDPage();

    cy.get("h2").contains("Drag and drop a widget here");
  });

  it("1. Published page loads correctly", () => {
    //add page within page
    cy.addDsl(dsl);
    // Update the text to be asserted later
    cy.openPropertyPane("textwidget");
    cy.testCodeMirror("This is Page 2");
    // Publish
    cy.PublishtheApp();
    // Assert active page tab
    cy.get(".t--page-switch-tab")
      .contains("Page2")
      .parent()
      .parent()
      .parent()
      .parent()
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
      .parent()
      .parent()
      .parent()
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
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
  });

  it("2. Hide Page and validate published app", () => {
    cy.get(publish.backToEditor).click();
    cy.actionContextMenuByEntityName("Page1", "Hide");
    cy.PublishtheApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
    cy.contains("Page2").should("not.exist");

    cy.get(publish.backToEditor).click();
    cy.SearchEntityandOpen("Page2");
    cy.PublishtheApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
    cy.contains("Page1").should("not.exist");
  });
});
