import {
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

describe(
  "Checkbox Tests",
  { tags: ["@tag.Widget", "@tag.Checkbox"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("checkboxgroupwidget", 550, 100);
    });

    it("1. Verify property visibility", function () {
      const defaultProperties = ["options", "defaultselectedvalues"];
      const labelProperties = ["text", "position"];
      const generalProperties = [
        "tooltip",
        "visible",
        "disabled",
        "inline",
        "selectalloptions",
        "animateloading",
        "height",
      ];
      const eventsProperties = ["onselectionchange"];
      const validationsProperties = ["required"];
      const labelStylesProperties = ["fontcolor", "fontsize", "emphasis"];
      const styleGeneralProperties = ["alignment"];
      const styleColorProperties = ["accentcolor"];

      EditorNavigation.SelectEntityByName("CheckboxGroup1", EntityType.Widget);
      defaultProperties.forEach((defaultSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "data",
            `${defaultSectionProperty}`,
          ),
        );
      });
      // Label Section properties
      labelProperties.forEach((labelSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "label",
            `${labelSectionProperty}`,
          ),
        );
      });
      // General Section properties
      generalProperties.forEach((generalSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "general",
            `${generalSectionProperty}`,
          ),
        );
      });
      // Events Section properties
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("events", `${eventsProperties}`),
      );
      // Validation Section properties
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "validations",
          `${validationsProperties}`,
        ),
      );
      // Style Section properties
      propPane.MoveToTab("Style");
      // Label Style Section properties
      labelStylesProperties.forEach((labelSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "labelstyles",
            `${labelSectionProperty}`,
          ),
        );
      });
      // General Style Section properties
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "general",
          `${styleGeneralProperties}`,
        ),
      );
      // Color Style Section properties
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "color",
          `${styleColorProperties}`,
        ),
      );
    });

    it("2. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer(
        "CheckboxGroup1",
        "NewCheckBox",
        true,
      );
      agHelper.AssertElementVisibility(locators._widgetName("NewCheckBox"));

      // Copy and paste widget using cmd+c and cmd+v
      entityExplorer.CopyPasteWidget("NewCheckBox");
      PageLeftPane.assertPresence("NewCheckBoxCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewCheckBoxCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewCheckBox");
      propPane.DeleteWidgetFromPropertyPane("NewCheckBoxCopy");
    });

    it("3. Verify Data can be added and deleted", () => {
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Content");
      agHelper.GetElementLength(propPane._placeholderName).then((len) => {
        agHelper.GetNClick(propPane._addOptionProperty);
        agHelper.RemoveCharsNType(propPane._placeholderName, -1, "Black", 3);
        agHelper.Sleep(500);
        agHelper.RemoveCharsNType(propPane._placeholderValue, -1, "BLACK", 3);
        // Verify option added
        agHelper.AssertElementLength(propPane._placeholderName, len + 1);

        // Preview mode
        agHelper.GetNClick(locators._enterPreviewMode);
        agHelper.AssertElementLength(propPane._checkbox, len + 1);
        agHelper.GetNClick(locators._exitPreviewMode);

        // Deploy mode
        deployMode.DeployApp();
        agHelper.AssertElementLength(propPane._checkbox, len + 1);
        deployMode.NavigateBacktoEditor();

        // Delete option
        EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
        agHelper.GetNClick(propPane._optionsDeleteButton, 3);
        // Verify option deleted
        agHelper.AssertElementLength(propPane._placeholderName, len);

        // Preview mode
        agHelper.GetNClick(locators._enterPreviewMode);
        agHelper.AssertElementLength(propPane._checkbox, len);
        agHelper.GetNClick(locators._exitPreviewMode);

        // Deploy mode
        deployMode.DeployApp();
        agHelper.AssertElementLength(propPane._checkbox, len);
        deployMode.NavigateBacktoEditor();
        EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      });
    });

    it("4. Verify changing Label text and position", () => {
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

      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      agHelper.GetNClick(`${locators._adsV2Text}:contains('Top')`);
      agHelper.AssertAttribute(locators._label, "position", "Top");
    });

    it("5. Verify tooltip", () => {
      entityExplorer.DragDropWidgetNVerify("currencyinputwidget", 550, 300);
      propPane.UpdatePropertyFieldValue("Default value", "1000");
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Tooltip", "{{CurrencyInput1.text}}");
      agHelper.HoverElement(locators._checkboxHelpIcon);
      agHelper.AssertPopoverTooltip("1,000");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.HoverElement(locators._checkboxHelpIcon);
      agHelper.AssertPopoverTooltip("1,000");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.HoverElement(locators._checkboxHelpIcon);
      agHelper.AssertPopoverTooltip("1,000");
      deployMode.NavigateBacktoEditor();
    });

    it("6. Verify onSelectionChange Navigat to", () => {
      PageList.AddNewPage();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.SelectPlatformFunction("onSelectionChange", "Navigate to");
      dataSources.ValidateNSelectDropdown(
        "Choose page",
        "Select page",
        "Page2",
      );
      agHelper.Sleep(2000);
      agHelper.GetNClick(propPane._checkbox, 1, true);
      PageList.VerifyIsCurrentPage("Page2");
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNClick(propPane._checkbox, 1, true);
      PageList.VerifyIsCurrentPage("Page2");
      agHelper.GetNClick(locators._exitPreviewMode);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNClick(propPane._checkbox, 1, true);
      agHelper
        .GetElement(`${locators._deployedPage}:contains("Page2")`)
        .should("have.class", "is-active");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
    });

    it("7. Verify Full color picker and font size", () => {
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
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

      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Style");
      cy.wait(1000);
      // Verify Accent color
      propPane.SelectColorFromColorPicker("accentcolor", -15);
      agHelper.AssertAttribute(
        `${locators._propertyControl}accentcolor ${propPane._roundCursorPointer}`,
        "color",
        "#dbeafe",
      );
      propPane.ToggleJSMode("accentcolor", true);
      propPane.UpdatePropertyFieldValue(
        "Accent color",
        "{{appsmith.theme.colors.primaryColor}}",
      );
      propPane.ToggleJSMode("accentcolor", false);
      agHelper.AssertAttribute(
        `${locators._propertyControl}accentcolor ${propPane._roundCursorPointer}`,
        "color",
        "#553DE9",
      );
      // Verify full color picker for accent color
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 1);
      propPane.TogglePropertyState("accentcolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 1);

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertAttribute(
        `${propPane._checkbox} input`,
        "borderradius",
        "0px",
      );
      propPane.ToggleJSMode("borderradius", true);
      propPane.UpdatePropertyFieldValue("Border radius", "0.375rem");
      agHelper.AssertAttribute(
        `${propPane._checkbox} input`,
        "borderradius",
        "0.375rem",
      );
    });

    it("8. Verify checkbox properties by updating text widget", () => {
      const options =
        '[{"label":"Blue","value":"BLUE"},{"label":"Green","value":"GREEN"},{"label":"Red","value":"RED"}]';

      entityExplorer.DragDropWidgetNVerify("textwidget", 550, 500);
      propPane.UpdatePropertyFieldValue("Text", "{{NewCheckBox.isVisible}}");
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      deployMode.NavigateBacktoEditor();

      // Verify checkbox visible
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("visible", "Off");
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );
      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("visible", "On");
      // Verify checkbox disabled
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.UpdatePropertyFieldValue("Text", "{{NewCheckBox.isDisabled}}");
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );
      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "false",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("disabled", "On");
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("NewCheckBox", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("disabled", "Off");

      // Verify selected value[All values selected]
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{NewCheckBox.selectedValues}}",
      );
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Delete",
        entityType: entityItems.Page,
      });
      agHelper.GetNClick(locators._checkboxWidgetLabel, 1);
      agHelper.GetNClick(locators._checkboxWidgetLabel, 2);
      agHelper.GetNAssertContains(locators._textWidget, '"BLUE"');
      agHelper.GetNAssertContains(locators._textWidget, '"GREEN"');
      agHelper.GetNAssertContains(locators._textWidget, '"RED"');

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"BLUE"');
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"GREEN"');
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"RED"');
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNClick(locators._checkboxWidgetLabel, 1);
      agHelper.GetNClick(locators._checkboxWidgetLabel, 2);
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"BLUE"');
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"GREEN"');
      agHelper.GetNAssertContains(locators._textWidgetContaioner, '"RED"');
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.UpdatePropertyFieldValue("Text", "{{NewCheckBox.isValid}}");
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "true",
      );
      deployMode.NavigateBacktoEditor();
    });
  },
);
