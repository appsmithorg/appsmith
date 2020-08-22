const pages = require("../../../locators/Pages.json");

describe("Pages", function() {
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
});
