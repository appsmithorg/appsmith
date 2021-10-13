const pages = require("../../../../locators/Pages.json");

describe("Pages", function() {
  let veryLongPageName = `abcdefghijklmnopqrstuvwxyz1234`;
  let apiName = "someApi";

  it("Clone page", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(apiName);

    cy.xpath(pages.popover)
      .last()
      .click({ force: true });
    cy.get(pages.clonePage).click({ force: true });

    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    // to check if apis are cloned
    cy.get(".t--entity-name:contains(Page1)")
      .its("length")
      .should("be.gt", 1);

    cy.get(
      `.t--entity-name:contains(Datasources) ~ .bp3-popover-wrapper .t--entity-add-btn`,
    ).click({
      multiple: true,
    });
    cy.get(`.t--entity-name:contains(${apiName})`).should("have.length", 2);
  });

  it("Creates a page with long name and checks if it shows tooltip on hover", () => {
    cy.Createpage(veryLongPageName);
    cy.PublishtheApp();
    cy.get(`.t--page-switch-tab:contains(${veryLongPageName})`).trigger(
      "mouseover",
    );
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain(veryLongPageName);
    });
  });

  it("Checks if 404 is showing correct route", () => {
    cy.visit("/route-that-does-not-exist");
    cy.get(".bold-text").should(($x) => {
      expect($x).contain("Page not found");
    });
  });
});
