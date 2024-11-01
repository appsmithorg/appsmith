import EditorNavigation, {
  EditorViewMode,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import FileTabs from "../../../../support/Pages/IDE/FileTabs";
import AddView from "../../../../support/Pages/IDE/AddView";

const agHelper = ObjectsRegistry.AggregateHelper;
const commonLocators = ObjectsRegistry.CommonLocators;

describe(
  "IDE add pane interactions",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  () => {
    it("1. UI tab add interactions", () => {
      // check add pane is open
      PageLeftPane.assertInAddView();
      // close add pane to show blank state
      PageLeftPane.closeAddView();
      // click on add button and check add state
      PageLeftPane.switchToAddNew();
      // check add pane
      PageLeftPane.assertInAddView();
      // drag and drop a widget and list view should be opened
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
      // check listing ui
      PageLeftPane.selectedItem().contains("Text1");
      // click add button
      PageLeftPane.switchToAddNew();
      // check add pane is open
      PageLeftPane.assertInAddView();
      // close add pane
      PageLeftPane.closeAddView();
      // click on canvas and check add pane visible or not
      agHelper.GetNClick(commonLocators._canvas).click();
      // check add pane
      PageLeftPane.assertInAddView();
    });

    it("2. JS tab add interactions", () => {
      /** Fullscreen  */
      //  switch to JS  tab from UI
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      // check and click on blank state add button
      PageLeftPane.switchToAddNew();
      // check listing UI
      PageLeftPane.assertInListView();
      // click on add btn in the listing UI
      PageLeftPane.switchToAddNew();
      // check item got added or not
      PageLeftPane.assertInListView();
      PageLeftPane.assertItemCount(2);
      /** Splitscreen  */
      // switch to splitscreen
      EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);
      // click on add
      FileTabs.switchToAddNew();
      // check tabs count to verify js added or not
      FileTabs.assertTabCount(3);
    });

    it("3. Queries tab add interactions", () => {
      /** Fullscreen  */
      EditorNavigation.SwitchScreenMode(EditorViewMode.FullScreen);
      //  switch to Query  tab from JS
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // check and click on blank state add button
      PageLeftPane.switchToAddNew();
      // check add pane
      PageLeftPane.assertInAddView();
      // close add tab
      FileTabs.closeTab("new_query");
      // open add pane to add item
      PageLeftPane.switchToAddNew();
      // add item
      cy.get(".t--new-blank-api").children("div").first().click();
      // check item added or not
      PageLeftPane.assertPresence("Api1");
      /** Splitscreen  */
      // switch to splitscreen
      EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);
      // click on add
      FileTabs.switchToAddNew();
      // check add pane
      PageLeftPane.assertInAddView();
      // add item
      cy.get(".t--new-blank-api").children("div").first().click();
      // check tabs count to verify js added or not
      FileTabs.assertTabCount(2);
    });
  },
);
