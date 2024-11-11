import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Pages", { tags: ["@tag.IDE", "@tag.PropertyPane"] }, function () {
  let veryLongPageName = `abcdefghijklmnopqrstuvwxyz1234`;
  let apiName = "someApi";

  it("1. Clone page & check tooltip for long name", function () {
    _.apiPage.CreateApi(apiName);
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    PageList.ClonePage("Page1");
    EditorNavigation.SelectEntityByName("Page1 Copy", EntityType.Page);
    EditorNavigation.SelectEntityByName(apiName, EntityType.Api); //Verify api also cloned along with PageClone

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
    EditorNavigation.SelectEntityByName("Page1 Copy", EntityType.Page);
    //Checks if 404 is showing correct route
    cy.visit("/route-that-does-not-exist");
    cy.get(_.locators.errorPageTitle).should(($x) => {
      expect($x).contain(Cypress.env("MESSAGES").PAGE_NOT_FOUND());
    });
  });
});
