import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Hide / Show page test functionality",
  { tags: ["@tag.IDE"] },
  function () {
    it("1. Hide/Show page test ", function () {
      cy.CreatePage(); // Page2
      cy.CreatePage(); // Page3
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Hide",
      });
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
