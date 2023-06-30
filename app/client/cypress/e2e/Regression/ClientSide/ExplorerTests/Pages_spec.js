import * as _ from "../../../../support/Objects/ObjectsCore";
const locators = {
  errorPageTitle: ".t--error-page-title",
};

describe("Pages", function () {
  let veryLongPageName = `abcdefghijklmnopqrstuvwxyz1234`;
  let apiName = "someApi";

  it("1. Clone page & check tooltip for long name", function () {
    //cy.NavigateToAPI_Panel();
    _.apiPage.CreateApi(apiName);
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.ClonePage("Page1");
    _.entityExplorer.SelectEntityByName("Page1 Copy", "Pages");
    _.entityExplorer.SelectEntityByName(apiName, "Queries/JS"); //Verify api also cloned along with PageClone

    //Creates a page with long name and checks if it shows tooltip on hover
    cy.get("body").click(0, 0);
    cy.Createpage(veryLongPageName);
    _.deployMode.DeployApp();
    cy.get(`.t--page-switch-tab:contains(${veryLongPageName})`).trigger(
      "mouseover",
    );
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain(veryLongPageName);
    });
  });

  it("2. Check for Refrsh page and validate and 404 is showing correct route", () => {
    //Automated as part Bug19654
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("Page1 Copy", "Pages");
    //Checks if 404 is showing correct route
    cy.visit("/route-that-does-not-exist");
    cy.get(locators.errorPageTitle).should(($x) => {
      expect($x).contain(Cypress.env("MESSAGES").PAGE_NOT_FOUND());
    });
  });
});
