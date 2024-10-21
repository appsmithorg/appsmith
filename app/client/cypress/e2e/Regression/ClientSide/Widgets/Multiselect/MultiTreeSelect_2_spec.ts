import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Multi Select widget Tests",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("multiTreeSelectDsl");
    });

    it("1. Verify default options are present in dropdown and default selected value", function () {
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._switcherIcon);
      agHelper.AssertElementExist(locators._dropDownMultiTreeValue("Blue"));
      agHelper.AssertElementExist(
        locators._dropDownMultiTreeValue("Dark Blue"),
      );
      agHelper.AssertElementExist(
        locators._dropDownMultiTreeValue("Light Blue"),
      );
      agHelper.AssertElementExist(locators._dropDownMultiTreeValue("Green"));
      agHelper.AssertElementExist(locators._dropDownMultiTreeValue("Red"));

      // Default selected value
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Green",
        "have.text",
      );
      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        `[
            "GREEN",
            "RED"
        ]`,
      );

      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Green",
        "have.text",
      );
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Red",
        "have.text",
        1,
      );
      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        `[
            "GREEN"
        ]`,
      );
    });

    it("2. Verify property visibility", function () {
      const dataProperties = ["options", "defaultselectedvalues"];
      const labelProperties = ["text", "position"];
      const generalProperties = [
        "tooltip",
        "mode",
        "placeholder",
        "visible",
        "disabled",
        "animateloading",
        "allowclearingvalue",
        "expandallbydefault",
        "height",
      ];
      const eventsProperties = [
        "onoptionchange",
        "ondropdownopen",
        "ondropdownclose",
      ];
      const validationsProperties = ["required"];

      const labelStylesProperties = ["fontcolor", "fontsize", "emphasis"];
      const borderShadows = ["borderradius", "boxshadow"];

      EditorNavigation.SelectEntityByName(
        "MultiTreeSelect1",
        EntityType.Widget,
      );
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

    it("3. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer(
        "MultiTreeSelect1",
        "NewMultiTreeSelect",
        true,
      );
      agHelper.AssertElementVisibility(
        locators._widgetName("NewMultiTreeSelect"),
      );

      // Copy and paste widget using cmd+c and cmd+v
      entityExplorer.CopyPasteWidget("NewMultiTreeSelect");
      PageLeftPane.assertPresence("NewMultiTreeSelectCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewMultiTreeSelectCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewMultiTreeSelect");
      propPane.DeleteWidgetFromPropertyPane("NewMultiTreeSelectCopy");
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.MoveToTab("Content");
    });

    it("4. Validate only selected options are reflected in widget area", () => {
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Red"));
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Red",
        "have.text",
        1,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Red"));
      agHelper.AssertElementAbsence(
        `${locators._treeSelectedContent}:contains('Red)`,
      );

      agHelper.GetNClick(locators._switcherIcon);
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Dark Blue"));
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Dark Blue",
        "have.text",
        1,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Dark Blue"));
      agHelper.AssertElementAbsence(
        `${locators._treeSelectedContent}:contains('Dark Blue)`,
      );
    });

    it("5. Verify changing Label text and position", () => {
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

      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      agHelper.GetNClick(`${locators._adsV2Text}:contains('Top')`);
      agHelper.AssertAttribute(locators._label, "position", "Top");
    });

    it("6. Verify tooltip", () => {
      EditorNavigation.SelectEntityByName("CurrencyInput1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default value", "1000");
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.UpdatePropertyFieldValue("Tooltip", "{{CurrencyInput1.text}}");
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("1,000");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("1,000");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("1,000");
      deployMode.NavigateBacktoEditor();
    });

    it("7. Verify Mode options", () => {
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.SelectPropertiesDropDown("Mode", "Display only parent items");
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._switcherIcon);
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Dark Blue"));
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Light Blue"));
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Blue",
        "have.text",
        1,
      );

      propPane.SelectPropertiesDropDown("Mode", "Display only child items");
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Dark Blue",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Light Blue",
        "have.text",
        2,
      );

      propPane.SelectPropertiesDropDown("Mode", "Display all items");
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Blue",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Dark Blue",
        "have.text",
        2,
      );
      agHelper.GetNAssertElementText(
        locators._treeSelectedContent,
        "Light Blue",
        "have.text",
        3,
      );
    });

    it("8. Verify placeholder", function () {
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Blue"));
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Green"));
      propPane.UpdatePropertyFieldValue("Placeholder", "Select new option");
      agHelper.AssertText(
        locators._treeSelectPlaceholder,
        "text",
        "Select new option",
      );
      // Binding with Text widget
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "Select value");
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.UpdatePropertyFieldValue("Placeholder", "{{Text1.text}}");
      agHelper.AssertText(
        locators._treeSelectPlaceholder,
        "text",
        "Select value",
      );
    });

    it("9. Validate visible and disabled toggle", () => {
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.TogglePropertyState("visible", "Off");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("multiselecttreewidget"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("multiselecttreewidget"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.TogglePropertyState("visible", "On");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("multiselecttreewidget"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("multiselecttreewidget"),
      );
      deployMode.NavigateBacktoEditor();

      // Visible JS mode
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "false");

      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("multiselecttreewidget"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "true");
      propPane.ToggleJSMode("Visible", false);

      // Disabled
      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.TogglePropertyState("disabled", "On");
      agHelper.AssertAttribute(
        locators._widgetInDeployed("multiselecttreewidget"),
        "disabled",
        "disabled",
      );

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(
        locators._widgetInDeployed("multiselecttreewidget"),
        "disabled",
        "disabled",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(
        locators._widgetInDeployed("multiselecttreewidget"),
        "disabled",
        "disabled",
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.TogglePropertyState("disabled", "Off");
    });

    it("10. Validate auto height with limits", function () {
      propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
      agHelper.HoverElement(propPane._autoHeightLimitMin);
      agHelper.AssertContains("Min-Height: 4 rows");
      agHelper.HoverElement(propPane._autoHeightLimitMax);
      agHelper.AssertContains("Max-Height: 13 rows");
      propPane.SelectPropertiesDropDown("height", "Auto Height");
    });

    it("11. Validate events onOptionChange, onDropdownOpen and onDropdownClose", function () {
      propPane.SelectPlatformFunction("onOptionChange", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Option Changed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Red"));
      agHelper.ValidateToastMessage("Option Changed");

      // onDropdownOpen
      propPane.SelectPlatformFunction("onDropdownOpen", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Dropdown Opened",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.ValidateToastMessage("Dropdown Opened");

      // Dropdown Close
      propPane.SelectPlatformFunction("onDropdownClose", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Dropdown Closed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.GetNClick(locators._dropDownMultiTreeSelect);
      agHelper.ValidateToastMessage("Dropdown Closed");
    });

    it("12. Verify Full color picker and font size", () => {
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

      EditorNavigation.SelectEntityByName(
        "NewMultiTreeSelect",
        EntityType.Widget,
      );
      propPane.MoveToTab("Style");

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertCSS(".rc-tree-select-selector", "border-radius", "0px");

      // Verify Box Shadow
      agHelper.GetNClick(
        `${propPane._segmentedControl("0")}:contains('Large')`,
      );
      agHelper.AssertCSS(
        ".rc-tree-select-selector",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
      propPane.MoveToTab("Content");
    });
  },
);
