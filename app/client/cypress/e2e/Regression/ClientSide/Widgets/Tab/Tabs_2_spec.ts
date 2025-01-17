import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
  table,
  tabs,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Tabs widget Tests",
  { tags: ["@tag.All", "@tag.Tab", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tabsDsl");
    });

    it("1. Verify property visibility", function () {
      const dataProperties = ["tabs", "defaulttab"];
      const generalProperties = [
        "visible",
        "animateloading",
        "showtabs",
        "height",
      ];
      const eventsProperties = ["ontabselected"];
      const colorsBorderShadows = [
        "accentcolor",
        "backgroundcolor",
        "bordercolor",
        "borderwidth",
        "borderradius",
        "boxshadow",
      ];

      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      // Data section
      dataProperties.forEach((dataSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "data",
            `${dataSectionProperty}`,
          ),
        );
      });

      // General section
      generalProperties.forEach((generalSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "general",
            `${generalSectionProperty}`,
          ),
        );
      });

      // Events section
      eventsProperties.forEach((eventsSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "events",
            `${eventsSectionProperty}`,
          ),
        );
      });

      propPane.MoveToTab("Style");
      // Style section
      colorsBorderShadows.forEach((styleSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            `colors\\,bordersandshadows`,
            `${styleSectionProperty}`,
          ),
        );
      });
    });

    it("2. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer("Tabs1", "NewTabs", true);
      agHelper.AssertElementVisibility(locators._widgetName("NewTabs"));

      // Copy and paste widget using cmd+c and cmd+v
      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);
      agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{c}`);
      agHelper.Sleep(500);
      agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{v}`);
      agHelper.Sleep(1000);
      PageLeftPane.expandCollapseItem("Tab 1");
      PageLeftPane.assertPresence("NewTabsCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewTabsCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewTabs");
      propPane.DeleteWidgetFromPropertyPane("NewTabsCopy");
      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);
      propPane.MoveToTab("Content");
    });

    it("3. Verify Binding with text widget", () => {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{NewTabs.selectedTab}}");
      agHelper.GetNClick(propPane._tabId1);
      agHelper.AssertText(locators._textInside, "text", "Tab 1");
      agHelper.GetNClick(propPane._tabId2);
      agHelper.AssertText(locators._textInside, "text", "Tab 2");

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{NewTabs.isVisible}}");
      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);
      propPane.TogglePropertyState("visible", "Off");
      agHelper.AssertText(locators._textInside, "text", "false");
      propPane.TogglePropertyState("visible", "On");
      agHelper.AssertText(locators._textInside, "text", "true");
    });

    it("4. Validate when 'Show Tabs' is set to False, all the Tabs get hidden", () => {
      propPane.TogglePropertyState("showtabs", "Off");
      agHelper.AssertElementAbsence(propPane._tabId1);
      agHelper.AssertElementAbsence(propPane._tabId2);
      propPane.TogglePropertyState("showtabs", "On");
      agHelper.AssertElementVisibility(propPane._tabId1);
      agHelper.AssertElementVisibility(propPane._tabId2);
    });

    it("5. Verify settings, delete and add button associated with tabs", () => {
      agHelper.AssertElementLength(propPane._tableEditColumnButton, 2);
      agHelper.AssertElementLength(table._deleteColumn, 2);

      propPane.OpenTableColumnSettings("tab1");
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("general", "visible"),
      );
      propPane.TogglePropertyState("visible", "Off");
      agHelper.AssertElementAbsence(propPane._tabId1);
      agHelper.AssertClassExists(`${propPane._tabId2} span`, "is-selected");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(propPane._tabId1);
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(propPane._tabId1);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);

      propPane.OpenTableColumnSettings("tab1");
      propPane.TogglePropertyState("visible", "On");
      agHelper.AssertElementVisibility(propPane._tabId1);

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(propPane._tabId1);
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(propPane._tabId1);
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);

      // Delete tab
      agHelper.GetNClick(table._deleteColumn, 1);
      agHelper.AssertElementAbsence(propPane._tabId2);

      // Add tab
      agHelper.GetNClick(tabs._addTab);
      agHelper.AssertText(tabs._placeholderTabTitle, "val", "Tab 2", 1);
    });

    it("6. Validate auto height with limits", function () {
      propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
      agHelper.HoverElement(propPane._autoHeightLimitMin);
      agHelper.AssertContains("Min-Height: 15 rows");
      agHelper.HoverElement(propPane._autoHeightLimitMax);
      agHelper.AssertContains("Max-Height: 21 rows");
      propPane.SelectPropertiesDropDown("height", "Auto Height");
    });

    // to work on redesign of the test, commenting for now
    it("7. Verify colors, borders and shadows", () => {
      // Verify font color picker opens up
      propPane.MoveToTab("Style");
      agHelper.GetNClick(propPane._propertyControlColorPicker("accentcolor"));
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      // Verify full color picker
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
      propPane.TogglePropertyState("accentcolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 0);

      // Background color
      agHelper.GetNClick(
        propPane._propertyControlColorPicker("backgroundcolor"),
      );
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      propPane.ToggleJSMode("backgroundcolor", true);
      propPane.UpdatePropertyFieldValue("Background color", "#eab308");
      agHelper.AssertCSS(
        tabs._tabsWidgetStyle,
        "background-color",
        "rgb(234, 179, 8)",
      );
      propPane.ToggleJSMode("backgroundcolor", false);

      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 1);
      propPane.TogglePropertyState("backgroundcolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 1);

      // Border Color
      propPane.SelectColorFromColorPicker("bordercolor", 13);
      assertHelper.AssertNetworkStatus("@updateLayout");

      agHelper
        .GetWidgetCSSFrAttribute(propPane._borderColorCursor, "color")
        .then((color) => {
          agHelper
            .GetWidgetCSSFrAttribute(locators._widgetBorder, "color", 1)
            .then((bgcolor) => {
              expect(color).to.eq(bgcolor);
            });
        });

      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 2);
      propPane.TogglePropertyState("bordercolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 2);

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertCSS(tabs._tabsWidgetStyle, "border-radius", "0px");

      // Verify Box Shadow
      agHelper.GetNClick(
        `${propPane._segmentedControl("0")}:contains('Large')`,
      );
      assertHelper.AssertNetworkStatus("@updateLayout");
      agHelper.AssertCSS(
        tabs._tabsWidgetStyle,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
    });

    it("8. Checks validation error in default selected tab", () => {
      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);

      propPane.MoveToTab("Content");

      propPane.TypeTextIntoField("Default tab", "Tab 11", true);

      agHelper.VerifyEvaluatedErrorMessage("Tab name Tab 11 does not exist");

      agHelper.ClearNType(
        locators._draggableFieldConfig("tab1") + " input",
        "Tab 11",
        0,
      );

      agHelper.AssertAutoSave();

      agHelper.Sleep(1000);

      agHelper.FocusElement(locators._propertyInputField("Default tab"));

      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

      propPane.TypeTextIntoField("Default tab", "Tab 13", true);

      agHelper.VerifyEvaluatedErrorMessage("Tab name Tab 13 does not exist");

      agHelper.AssertAutoSave();

      agHelper.Sleep(1000);

      cy.reload();

      EditorNavigation.SelectEntityByName("NewTabs", EntityType.Widget);

      agHelper.FocusElement(locators._propertyInputField("Default tab"));

      agHelper.VerifyEvaluatedErrorMessage("Tab name Tab 13 does not exist");
    });
  },
);
