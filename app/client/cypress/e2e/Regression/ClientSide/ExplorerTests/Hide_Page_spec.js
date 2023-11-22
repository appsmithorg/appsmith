import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const pages = require("../../../../locators/Pages.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const pageOne = "MyPage1";
const pageTwo = "MyPage2";

describe("Hide / Show page test functionality", function () {
  it("1. Hide/Show page test ", function () {
    cy.Createpage(pageOne);
    cy.Createpage(pageTwo);
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    cy.get(`.t--entity-item:contains('MyPage2')`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.get(pages.hidePage).click({ force: true });
    cy.ClearSearch();
    _.deployMode.DeployApp();
    cy.get(".t--page-switch-tab").should("have.length", 2);
    //Show page test
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "MyPage2",
      action: "Show bindings",
    });
    cy.ClearSearch();
    _.deployMode.DeployApp();
    cy.get(".t--page-switch-tab").should("have.length", 3);
  });
});
