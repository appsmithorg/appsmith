const pages = require("../../../../locators/Pages.json");

const pageOne = "MyPage1";
const pageTwo = "MyPage2";

describe("Hide page", function() {
  it("Hide page", function() {
    cy.Createpage(pageOne);
    cy.Createpage(pageTwo);

    cy.GlobalSearchEntity(pageOne);
    cy.xpath(pages.popover)
      .last()
      .click({ force: true });
    cy.get(pages.hidePage).click({ force: true });
    cy.ClearSearch();

    cy.PublishtheApp();
    cy.get(".t--page-switch-tab").should("have.length", 2);
  });
});
