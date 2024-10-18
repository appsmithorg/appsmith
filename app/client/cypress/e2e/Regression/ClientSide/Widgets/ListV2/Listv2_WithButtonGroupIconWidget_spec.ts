import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "List widget V2 functionality with button, button group and icon button widgets",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
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
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      propPane.AssertPropertyVisibility(basicProperties, "basic");
      propPane.AssertPropertyVisibility(generalProperties1, "general");
      propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

      // Button widget inside List
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "List1",
        "Container1",
      ]);
      propPane.AssertPropertyVisibility(basicProperties, "basic");
      propPane.AssertPropertyVisibility(generalProperties1, "general");
      propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

      EditorNavigation.SelectEntityByName("ButtonGroup2", EntityType.Widget);
      // Button group widget outside List
      propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
      propPane.AssertPropertyVisibility(
        buttonGroupGeneralProperties,
        "general",
      );

      // Button group widget inside List
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
      propPane.AssertPropertyVisibility(
        buttonGroupGeneralProperties,
        "general",
      );

      // Icon Button widget outside List
      EditorNavigation.SelectEntityByName("IconButton2", EntityType.Widget);
      propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
      propPane.AssertPropertyVisibility(
        buttonGroupGeneralProperties,
        "general",
      );

      // Icon Button widget inside List
      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
      propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
      propPane.AssertPropertyVisibility(
        buttonGroupGeneralProperties,
        "general",
      );
    });

    it("2. Verify onClick functionality", () => {
      // Button
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Button Clicked",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      agHelper.ValidateToastMessage("Button Clicked");

      // Icon Button
      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "List1",
        "Container1",
      ]);
      propPane.MoveToTab("Style");
      agHelper.AssertAttribute(
        "[data-value='PRIMARY']",
        "data-selected",
        "true",
      );
      agHelper.GetNClick("[data-value='SECONDARY']");
      agHelper.AssertAttribute(
        "[data-value='PRIMARY']",
        "data-selected",
        "false",
      );

      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
      propPane.MoveToTab("Style");
      agHelper.AssertAttribute(
        "[data-value='PRIMARY']",
        "data-selected",
        "true",
      );

      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      propPane.MoveToTab("Style");
      agHelper.AssertAttribute(
        "[data-value='PRIMARY']",
        "data-selected",
        "true",
      );
    });
  },
);
