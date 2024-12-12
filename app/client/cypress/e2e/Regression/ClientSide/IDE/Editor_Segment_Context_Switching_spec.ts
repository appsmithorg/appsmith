import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";

describe(
  "Editor Segment Context Switch",
  { tags: ["@tag.IDE", "@tag.ImportExport", "@tag.PropertyPane", "@tag.Git"] },
  function () {
    before("Import the test application", () => {
      homePage.CreateNewWorkspace("IDETest", true);
      homePage.ImportApp("SampleAppIDETest.json", "IDETest");
      cy.wait("@importNewApplication").then((interception) => {
        agHelper.Sleep();
        const { isPartialImport } = interception.response?.body.data;
        cy.log("isPartialImport is", isPartialImport);
        if (isPartialImport) {
          // should reconnect modal
          cy.get("body").then(($ele) => {
            if ($ele.find(reconnectDatasourceModal.SkipToAppBtn))
              agHelper.GetNClick(
                reconnectDatasourceModal.SkipToAppBtn,
                0,
                true,
              );
            else agHelper.ClickButton("Got it");
            agHelper.Sleep(2000);
          });
        } else {
          homePage.AssertImportToast();
        }
      });
    });
    it("will select an item when switched to it", () => {
      // Check JS item is selected
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.selectedItem("not.exist");

      // Check Query item is selected
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.selectedItem("not.exist");

      // Check UI item is selected
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.selectedItem().should("be.visible");
    });
    it("will select previously selected item when switched to it", () => {
      // Select a UI item
      EditorNavigation.SelectEntityByName(
        "txt_longitudeValue",
        EntityType.Widget,
        {},
        ["con_userDetails"],
      );

      // Select a JS item
      EditorNavigation.SelectEntityByName("Transformers", EntityType.JSObject);

      // Select a Query item
      EditorNavigation.SelectEntityByName("addUser", EntityType.Query);

      // Check UI item is selected
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.selectedItem().contains("txt_longitudeValue");

      // Check JS item is selected
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.selectedItem().contains("Transformers");

      // Check Query item is selected
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.selectedItem().contains("addUser");
    });
    it("will not retain the add state of the segment", () => {
      // Switch to add new in UI
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();

      // Switch to add new in Query
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.switchToAddNew();

      // Assert add state not in UI
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      // Assumes that selected item is not visible when in add state
      PageLeftPane.selectedItem().should("be.visible");

      // Assert add state not in Query
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // Assumes that selected item is not visible when in add state
      PageLeftPane.selectedItem().should("be.visible");
    });

    it("will retain segment and selected item on switching IDE state", () => {
      // Switch to add new in Query
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // Select a Query item
      EditorNavigation.SelectEntityByName("updateUsers", EntityType.Query);
      // Switch to Data state
      AppSidebar.navigate(AppSidebarButton.Data);

      // Switch back to Editor state
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.selectedItem().contains("updateUsers");
    });
  },
);
