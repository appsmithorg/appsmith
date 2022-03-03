const dsl = require("../../../../fixtures/PageLoadDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const pages = require("../../../../locators/Pages.json");
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
  it("Published page loads correctly", () => {
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
      .should("have.class", "is-active");
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
  });

  it.skip("Hide Page and validate published app", () => {
    cy.get(publish.backToEditor).click();
    cy.GlobalSearchEntity("Page1");
    cy.xpath(pages.popover)
      .last()
      .click({ force: true });
    cy.get(pages.hidePage).click({ force: true });
    cy.ClearSearch();
    cy.PublishtheApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 1",
    );
    cy.get(publish.backToEditor).click();
    cy.SearchEntityandOpen("Page2");
    cy.PublishtheApp();
    // Assert active page DSL
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      "This is Page 2",
    );
  });
});
