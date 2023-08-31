import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  appSettings,
  assertHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Statbox spec", () => {
  before(() => {
    /**
     * On the canvas we have a Statbox Widget
     */
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.STATBOX, 550, 100);
  });

  it("1. Validate all the respective properties are present on the Content and Style sections in the property pane", () => {
    agHelper.AssertContains("Visible", "exist", "label");
    agHelper.AssertContains("Animate loading", "exist", "label");
    agHelper.AssertContains("Height", "exist", "label");
    // Switch to the Style Tab
    propPane.MoveToTab("Style");
    agHelper.AssertContains("Background color", "exist", "label");
    agHelper.AssertContains("Border color", "exist", "label");
    agHelper.AssertContains("Border width", "exist", "label");
    agHelper.AssertContains("Border radius", "exist", "label");
    agHelper.AssertContains("Box shadow", "exist", "label");
  });

  // it("2. Rename, copy-paste and delete the widget", () => {
  //   entityExplorer.RenameEntityFromExplorer("Statbox1", "Stats", true);
  //   propPane.CopyPasteWidgetFromPropertyPane("Stats");
  //   entityExplorer.DeleteWidgetFromEntityExplorer("Stats");
  // });

  it("3. Validate default widgets presence inside the statbox", () => {
    entityExplorer.NavigateToSwitcher("Explorer");
    entityExplorer.AssertEntityPresenceInExplorer("Statbox1");
    entityExplorer.ExpandCollapseEntity("Statbox1");
    entityExplorer.AssertEntityPresenceInExplorer("Text1");
    entityExplorer.AssertEntityPresenceInExplorer("Text2");
    entityExplorer.AssertEntityPresenceInExplorer("IconButton1");
    entityExplorer.AssertEntityPresenceInExplorer("Text3");
  });

  it("4. Validate visibility", () => {
    propPane.MoveToTab("Content");
    propPane.TogglePropertyState("Visible", "Off");
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInCanvas(draggableWidgets.STATBOX),
    );
    deployMode.NavigateBacktoEditor();
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertElementAbsence(
      locators._widgetInCanvas(draggableWidgets.STATBOX),
    );
    agHelper.GetNClick(locators._exitPreviewMode);
    entityExplorer.SelectEntityByName("Statbox1", "Widgets");
    propPane.TogglePropertyState("Visible", "On");
  });

  // it("5. Validate if widgets can be D&D inside the Statbox widget", () => {
  //   entityExplorer.DragDropWidgetNVerify(
  //     draggableWidgets.BUTTON,
  //     550,
  //     100,
  //     draggableWidgets.STATBOX,
  // );
  //});
});
