import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

import * as _ from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Hide / Show page test functionality",
  { tags: ["@tag.IDE"] },
  function () {
    it("1. Hide/Show page test ", function () {
      PageList.AddNewPage(); // Page2
      PageList.AddNewPage(); // Page3
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Hide",
      });
      PageLeftPane.switchToAddNew();
      cy.ClearSearch();
      _.deployMode.DeployApp();
      cy.get(".t--page-switch-tab").should("have.length", 2);
      //Show page test
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Show",
      });
      cy.ClearSearch();
      _.deployMode.DeployApp();
      cy.get(".t--page-switch-tab").should("have.length", 3);
    });
  },
);
