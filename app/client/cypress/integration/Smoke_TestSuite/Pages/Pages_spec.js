const pages = require("../../../locators/Pages.json");

describe("Pages", function() {
  let veryLongPageName = `abcdefghijklmnopqrstuvwxyz1234`;

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
    cy.get(".t--page-switch-tab:nth-child(3)").trigger("mouseover");
    cy.get(".bp3-popover-content").should($x => {
      expect($x).contain(veryLongPageName);
    });
  });
});
