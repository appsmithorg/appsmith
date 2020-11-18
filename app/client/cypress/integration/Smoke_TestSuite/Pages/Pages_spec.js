const pages = require("../../../locators/Pages.json");

describe("Pages", function() {
  let veryLongPageName = `gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1gnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionihgnerwihnireongionih1`;

  it("Clone page", function() {
    cy.xpath(pages.popover)
      .last()
      .click({ force: true });
    cy.get(pages.clonePage).click({ force: true });

    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(".t--entity-name:contains(Page1 Copy)");
  });

  it("Creates a page with long name and checks if it shows tooltip on hover", () => {
    cy.Createpage(veryLongPageName);
    cy.PublishtheApp();
    cy.get(".t--page-switch-tab")
      .contains("Page1")
      .parent()
      .next()
      .next()
      .trigger("mouseover");

    cy.get(".bp3-popover-target.bp3-popover-open").should("have.length", 1);
  });
});
