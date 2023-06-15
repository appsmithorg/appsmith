const pages = require("../../../../locators/Pages.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

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
    _.deployMode.DeployApp();
    cy.get(".t--page-switch-tab").should("have.length", 2);
    //Show page test
    _.deployMode.NavigateBacktoEditor();
    cy.get(`.t--entity-name:contains('MyPage2')`).trigger("mouseover");
    cy.hoverAndClick("MyPage2");
    cy.selectAction("Show");
    cy.ClearSearch();
    _.deployMode.DeployApp();
    cy.get(".t--page-switch-tab").should("have.length", 3);
  });
});
