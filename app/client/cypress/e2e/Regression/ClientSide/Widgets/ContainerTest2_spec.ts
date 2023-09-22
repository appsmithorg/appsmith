import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Rich Text Editor widget Tests", function () {
  before(() => {
    agHelper.AddDsl("ContainerWithOtherWidgetsDsl");
    entityExplorer.SelectEntityByName("Container1", "Widgets");
  });

  it("1. Verify property visibility", function () {
    const generalProperties = ["visible", "animateloading", "height"];

    const styleColorProperties = ["backgroundcolor", "bordercolor"];

    const styleBorderProperties = ["borderwidth", "borderradius", "boxshadow"];

    propPane.AssertPropertyVisibility(generalProperties, "general");
    propPane.MoveToTab("Style");
    propPane.AssertPropertyVisibility(styleColorProperties, "color");
    propPane.AssertPropertyVisibility(styleBorderProperties, "borderandshadow");
    propPane.MoveToTab("Content");
  });

  it("2. Verify Renaming, duplication and deletion", () => {
    // Rename and verify
    entityExplorer.RenameEntityFromExplorer("Container1", "NewContainer", true);
    agHelper.AssertElementVisibility(locators._widgetName("NewContainer"));

    // Copy and paste widget using cmd+c and cmd+v
    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{c}`);
    agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{v}`);
    agHelper.Sleep(1000);
    entityExplorer.ExpandCollapseEntity("NewContainer");
    entityExplorer.AssertEntityPresenceInExplorer("NewContainerCopy");
    entityExplorer.DeleteWidgetFromEntityExplorer("NewContainerCopy");

    // Copy paste from property pane and delete from property pane
    propPane.CopyPasteWidgetFromPropertyPane("NewContainer");
    propPane.DeleteWidgetFromPropertyPane("NewContainerCopy");
  });

  it("3. Verify height changes according to child widget visibility", () => {
    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    agHelper.AssertCSS(
      locators._widgetInDeployed("newcontainer"),
      "height",
      "440px",
    );
    entityExplorer.SelectEntityByName("List1", "Widgets");
    propPane.TogglePropertyState("visible", "Off");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertCSS(
      locators._widgetInDeployed("newcontainer"),
      "height",
      "100px",
    );
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertCSS(
      locators._widgetInDeployed("newcontainer"),
      "height",
      "100px",
    );
    deployMode.NavigateBacktoEditor();

    // Verify multiple widgets selected groups into single container
    entityExplorer.SelectEntityByName("Input1", "Widgets", true);
    entityExplorer.SelectEntityByName("Select1", "Widgets", true);
    entityExplorer.SelectEntityByName("Text3", "Widgets", true);
    agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{g}`);
    agHelper.Sleep(1000);
    entityExplorer.AssertEntityPresenceInExplorer("Container3");
    entityExplorer.DeleteWidgetFromEntityExplorer("Container3");
  });

  it("4. Validate visible toggle", () => {
    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    propPane.TogglePropertyState("visible", "Off");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertElementAbsence(locators._widgetInDeployed("newcontainer"));
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(locators._widgetInDeployed("newcontainer"));
    deployMode.NavigateBacktoEditor();

    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    propPane.TogglePropertyState("visible", "On");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed("newcontainer"),
    );
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed("newcontainer"),
    );
    deployMode.NavigateBacktoEditor();

    // Visible JS mode
    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    propPane.ToggleJSMode("Visible", true);
    propPane.UpdatePropertyFieldValue("Visible", "false");

    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed("iconbuttonwidget"),
    );
    deployMode.NavigateBacktoEditor();

    entityExplorer.SelectEntityByName("NewContainer", "Widgets");
    propPane.ToggleJSMode("Visible", true);
    propPane.UpdatePropertyFieldValue("Visible", "true");
    propPane.ToggleJSMode("Visible", false);
  });

  it("5. Validate auto height with limits", function () {
    propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
    agHelper.HoverElement(propPane._autoHeightLimitMin);
    agHelper.AssertContains("Min-Height: 10 rows");
    agHelper.HoverElement(propPane._autoHeightLimitMax);
    agHelper.AssertContains("Max-Height: 46 rows");
  });
});
