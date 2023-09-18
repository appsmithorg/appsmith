import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("List widget V2 functionality with button, button group and icon button widgets", () => {
  before(() => {
    agHelper.AddDsl("listV2ButtonsDsl", locators._buttonByText("Submit"));
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 500);
    entityExplorer.DragDropWidgetNVerify("buttongroupwidget", 500, 600);
    entityExplorer.DragDropWidgetNVerify("iconbuttonwidget", 500, 700);
  });

  it("1. Verify property visibility", () => {
    const basicProperties = ["label", "onclick"];

    const generalProperties1 = ["visible", "disabled", "animateloading"];

    const formSettingsProperties = [
      "disabledinvalidforms",
      "resetformonsuccess",
    ];

    const buttonGroupDataProperties = ["buttons"];

    const buttonGroupGeneralProperties = [
      "visible",
      "disabled",
      "animateloading",
    ];

    const iconButtonbasicProperties = ["icon", "onclick"];

    // Button widget outside List
    entityExplorer.SelectEntityByName("Button2", "Widgets");
    propPane.AssertPropertyVisibility(basicProperties, "basic");
    propPane.AssertPropertyVisibility(generalProperties1, "general");
    propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

    // Button widget inside List
    entityExplorer.SelectEntityByName("List1", "Widgets");
    entityExplorer.SelectEntityByName("Container1", "List1");
    entityExplorer.SelectEntityByName("Button1", "Container1");
    propPane.AssertPropertyVisibility(basicProperties, "basic");
    propPane.AssertPropertyVisibility(generalProperties1, "general");
    propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

    entityExplorer.SelectEntityByName("ButtonGroup2", "Widgets");
    // Button group widget outside List
    propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Button group widget inside List
    entityExplorer.SelectEntityByName("ButtonGroup1", "Widgets");
    propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Icon Button widget outside List
    entityExplorer.SelectEntityByName("IconButton2", "Widgets");
    propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Icon Button widget inside List
    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");
  });

  it("2. Verify onClick functionality", () => {
    // Button
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Button Clicked",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.ValidateToastMessage("Button Clicked");

    // Icon Button
    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Icon Button Clicked",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.WaitUntilToastDisappear("Button Clicked");
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.WaitUntilToastDisappear("Button Clicked");
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Verify Styles should be configured individually", () => {
    entityExplorer.SelectEntityByName("List1", "Widgets");
    entityExplorer.SelectEntityByName("Container1", "List1");
    entityExplorer.SelectEntityByName("Button1", "Container1");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");
    agHelper.GetNClick("[data-value='SECONDARY']");
    agHelper.AssertAttribute(
      "[data-value='PRIMARY']",
      "data-selected",
      "false",
    );

    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");

    entityExplorer.SelectEntityByName("ButtonGroup1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");
  });
});
