const pages = require("../../../../locators/Pages.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Pages", function() {
  let veryLongPageName = `abcdefghijklmnopqrstuvwxyz1234`;
  let apiName = "someApi";

  it("Clone page", function() {
    cy.wait(20000);
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(apiName);

    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.xpath(apiwidget.popover)
      .first()
      .should("be.hidden")
      .invoke("show")
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

    cy.get(".t--entity-name:contains(Page1 Copy)").click({ force: true });

    cy.get(".t--entity-name:contains(Page1 Copy)")
      .its("length")
      .should("eq", 1);

    cy.get(explorerLocators.addQuery)
      .last()
      .click();
    cy.get(`.t--entity-name:contains(${apiName})`).should("have.length", 1);
  });

  it("Creates a page with long name and checks if it shows tooltip on hover", () => {
    cy.get("body").click(0, 0);
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
