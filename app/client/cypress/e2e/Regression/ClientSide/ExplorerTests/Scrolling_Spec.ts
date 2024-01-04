import {
  agHelper,
  draggableWidgets,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Entity explorer context menu should hide on scrolling",
  { tags: ["@tag.IDE"] },
  function () {
    it("1. Bug #15474 - Entity explorer menu must close on scroll", function () {
      // Setup to make the explorer scrollable
      for (let i = 0; i < 8; i++) {
        entityExplorer.DragNDropWidget(draggableWidgets.MODAL);
        PageLeftPane.assertPresence("Modal1");
        PageLeftPane.switchToAddNew();
        cy.get("body").type("{esc}");
      }
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      for (let i = 0; i < 8; i++) {
        PageLeftPane.expandCollapseItem(`Modal${i + 1}`);
      }
      agHelper.GetNClick(entityExplorer._contextMenu("Modal7"), 0, true);
      agHelper.AssertElementVisibility(entityExplorer._adsPopup);
      agHelper.ScrollTo(PageLeftPane.locators.selector, "top");
      agHelper.AssertElementAbsence(entityExplorer._adsPopup);
    });
  },
);
