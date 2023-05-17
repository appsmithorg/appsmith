const pages = require("../../../../locators/Pages.json");
const publish = require("../../../../locators/publishWidgetspage.json");

const pageOne = "MyPage1";
const pageTwo = "MyPage2";

describe("Hide / Show page test functionality", function () {
  it("1. Hide/Show page test ", function () {
    cy.Createpage(pageOne);
    cy.Createpage(pageTwo);
    cy.get(".t--entity-name").contains("Page1").click({ force: true });
    cy.get(`.t--entity-item:contains('MyPage2')`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.get(pages.hidePage).click({ force: true });
    cy.ClearSearch();
    cy.PublishtheApp();
    cy.get(".t--page-switch-tab").should("have.length", 2);
    //Show page test
    cy.get(publish.backToEditor).click();
    cy.get(`.t--entity-name:contains('MyPage2')`).trigger("mouseover");
    cy.hoverAndClick("MyPage2");
    cy.selectAction("Show");
    cy.ClearSearch();
    cy.PublishtheApp();
    cy.get(".t--page-switch-tab").should("have.length", 3);
  });
});
