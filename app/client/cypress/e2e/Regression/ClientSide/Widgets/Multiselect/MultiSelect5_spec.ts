import {
  agHelper,
  deployMode,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Multi Select widget Tests",
  { tags: ["@tag.Widget", "@tag.Multiselect"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("multiselectwidgetv2", 550, 100);
    });

    it("1. Verify property visibility", function () {
      const dataProperties = [
        "sourcedata",
        "labelkey",
        "valuekey",
        "defaultselectedvalues",
      ];
      const labelProperties = ["text", "position"];
      const searchfilterProperties = ["allowsearching", "serversidefiltering"];
      const generalProperties = [
        "tooltip",
        "placeholder",
        "visible",
        "disabled",
        "animateloading",
        "allowselectall",
        "height",
      ];
      const eventsProperties = [
        "onoptionchange",
        "ondropdownopen",
        "ondropdownclose",
      ];
      const validationsProperties = ["required"];

      const labelStylesProperties = ["fontcolor", "fontsize"];
      const borderShadows = ["borderradius", "boxshadow"];

      EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);
      // Data section
      dataProperties.forEach((dataSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "data",
            `${dataSectionProperty}`,
          ),
        );
      });

      // Label section
      labelProperties.forEach((labelSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "label",
            `${labelSectionProperty}`,
          ),
        );
      });

      // Search & filters section
      searchfilterProperties.forEach((searchSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "search\\&filters",
            `${searchSectionProperty}`,
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

      // Validation Section properties
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "validations",
          `${validationsProperties}`,
        ),
      );

      propPane.MoveToTab("Style");
      labelStylesProperties.forEach((labelStyleSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "labelstyles",
            `${labelStyleSectionProperty}`,
          ),
        );
      });
      borderShadows.forEach((borderShadowSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "borderandshadow",
            `${borderShadowSectionProperty}`,
          ),
        );
      });
    });

    it("2. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer(
        "MultiSelect1",
        "NewMultiSelect",
        true,
      );
      agHelper.AssertElementVisibility(locators._widgetName("NewMultiSelect"));

      // Copy and paste widget using cmd+c and cmd+v
      entityExplorer.CopyPasteWidget("NewMultiSelect");
      PageLeftPane.assertPresence("NewMultiSelectCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewMultiSelectCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewMultiSelect");
      propPane.DeleteWidgetFromPropertyPane("NewMultiSelectCopy");
      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);
      propPane.MoveToTab("Content");
    });

    it("3. Verify changing Label text and position", () => {
      propPane.UpdatePropertyFieldValue("Text", "New Label");
      agHelper.AssertText(locators._label, "text", "New Label");
      agHelper.GetNClick(`${locators._adsV2Text}:contains('Left')`);
      agHelper.AssertAttribute(locators._label, "position", "Left");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(locators._label, "position", "Left");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(locators._label, "position", "Left");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);
      agHelper.GetNClick(`${locators._adsV2Text}:contains('Top')`);
      agHelper.AssertAttribute(locators._label, "position", "Top");
    });

    it("5. Verify tooltip", () => {
      entityExplorer.DragDropWidgetNVerify("currencyinputwidget", 550, 300);
      propPane.UpdatePropertyFieldValue("Default value", "1000");
      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Tooltip", "{{CurrencyInput1.text}}");
      agHelper.HoverElement(".bp3-popover-target svg");
      agHelper.AssertPopoverTooltip("1,000");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.HoverElement(".bp3-popover-target svg");
      agHelper.AssertPopoverTooltip("1,000");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.HoverElement(".bp3-popover-target svg");
      agHelper.AssertPopoverTooltip("1,000");
      deployMode.NavigateBacktoEditor();
    });

    it("6. Validate 'visible' and 'disable' toggle", () => {
      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);

      // Verify Disabled toggle
      propPane.TogglePropertyState("disabled", "On");
      agHelper.AssertAttribute(
        locators._widgetInDeployed("multiselectwidgetv2"),
        "disabled",
        "disabled",
      );
      propPane.TogglePropertyState("disabled", "Off");
      // Verify Visible toggle
      propPane.TogglePropertyState("visible", "Off");
      agHelper.AssertAttribute(
        locators._widgetInDeployed("multiselectwidgetv2"),
        "data-hidden",
        "true",
      );
      agHelper.AssertExistingToggleState("visible", "false");
      propPane.TogglePropertyState("visible", "On");
      agHelper.AssertExistingToggleState("visible", "true");
    });

    it("7. Validate auto height with limits", function () {
      propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
      agHelper.HoverElement(propPane._autoHeightLimitMin);
      agHelper.AssertContains("Min-Height: 4 rows");
      agHelper.HoverElement(propPane._autoHeightLimitMax);
      agHelper.AssertContains("Max-Height: 9 rows");
      propPane.SelectPropertiesDropDown("height", "Auto Height");
    });

    it("7. Validate events onOptionChange, onDropdownOpen and onDropdownClose", function () {
      propPane.SelectPlatformFunction("onOptionChange", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Option Changed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      agHelper.SelectFromMultiSelect(["Blue"]);
      agHelper.ValidateToastMessage("Option Changed");

      // onDropdownOpen
      propPane.SelectPlatformFunction("onDropdownOpen", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Dropdown Opened",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.GetNClick(propPane._multiSelect);
      agHelper.ValidateToastMessage("Dropdown Opened");

      // Dropdown Close
      propPane.SelectPlatformFunction("onDropdownClose", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Dropdown Closed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.GetNClick(propPane._multiSelect);
      agHelper.GetNClick(propPane._multiSelect);
      agHelper.ValidateToastMessage("Dropdown Closed");
    });

    it("8. Verify Full color picker and font size", () => {
      // Verify font color picker opens up
      propPane.MoveToTab("Style");
      agHelper.GetNClick(propPane._propertyControlColorPicker("fontcolor"));
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      // Verify full color picker
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
      propPane.TogglePropertyState("fontcolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 0);
      // Font size
      propPane.SelectPropertiesDropDown("fontsize", "L");
      propPane.AssertPropertiesDropDownCurrentValue("fontsize", "L");
      propPane.ToggleJSMode("fontsize", true);
      propPane.UpdatePropertyFieldValue("Font size", "1rem");
      propPane.ToggleJSMode("fontsize", false);
      propPane.AssertPropertiesDropDownCurrentValue("fontsize", "M");
      // Verify Emphasis
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      agHelper.AssertAttribute(locators._label, "font-style", "BOLD");
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      propPane.ToggleJSMode("emphasis", true);
      propPane.UpdatePropertyFieldValue("Emphasis", "ITALIC");
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);
      propPane.MoveToTab("Style");

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertCSS(
        `${propPane._multiSelect} .rc-select-selector`,
        "border-radius",
        "0px",
      );

      // Verify Box Shadow
      agHelper.GetNClick(
        `${propPane._segmentedControl("0")}:contains('Large')`,
      );
      agHelper.AssertCSS(
        `${propPane._multiSelect} .rc-select-selector`,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
    });

    //Skipping due to open bug #16870
    it("8. Bug # 16870 - Verify validation error in default selected values", () => {
      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);

      propPane.MoveToTab("Content");

      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        '["GREEN1", "RED1"]',
      );

      agHelper.VerifyEvaluatedErrorMessage(
        "Some or all default values are missing from options. Please update the values.",
      );

      propPane.ToggleJSMode("Source Data", true);

      // Updates the options and asserts that the validation error is fixed
      propPane.UpdatePropertyFieldValue(
        "Source Data",
        '[{"name": "Green", "code":"GREEN1"}, { "name": "Red","code": "RED1" }]',
      );

      agHelper.FocusElement(
        locators._propertyInputField("Default selected values"),
      );
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

      // Changes options to bring back validation error
      propPane.UpdatePropertyFieldValue(
        "Source Data",
        '[{"name": "Green", "code":"GREEN1"}, { "name": "Red","code": "RED" }]',
      );

      agHelper.FocusElement(
        locators._propertyInputField("Default selected values"),
      );

      agHelper.VerifyEvaluatedErrorMessage(
        "Some or all default values are missing from options. Please update the values.",
      );

      // Reload to check if the error persists
      agHelper.RefreshPage();

      EditorNavigation.SelectEntityByName("NewMultiSelect", EntityType.Widget);

      agHelper.FocusElement(
        locators._propertyInputField("Default selected values"),
      );

      agHelper.VerifyEvaluatedErrorMessage(
        "Some or all default values are missing from options. Please update the values.",
      );

      // Fixes the validation error
      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        '{{["GREEN1"]}}',
        true,
      );
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });
  },
);
