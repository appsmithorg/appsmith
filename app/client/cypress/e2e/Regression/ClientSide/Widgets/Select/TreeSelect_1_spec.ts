import {
    agHelper,
    locators,
    deployMode,
    entityExplorer,
    propPane
  } from "../../../../../support/Objects/ObjectsCore";
  
  describe("Tree Select widget Tests", function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("formwidget", 550, 100);
      entityExplorer.DragDropWidgetNVerify("singleselecttreewidget", 400, 300);
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 300);
    });

    let options = `[
        {
          "label": "Blue",
          "value": "BLUE",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`
  
    it("1. Verify required", function () {
        entityExplorer.SelectEntityByName("TreeSelect1", "Widgets");
        // propPane.ToggleJSMode("options", true);
        // propPane.ToggleJSMode("required", true);
        propPane.TogglePropertyState("required", "On");
        propPane.UpdatePropertyFieldValue("Default selected value", "");
        agHelper.AssertElementEnabledDisabled(".bp3-button", 1);
        // Binding with Button
        propPane.ToggleJSMode("required", true);
        propPane.UpdatePropertyFieldValue("Required", "{{Button3.isDisabled?false:true}}");
        entityExplorer.SelectEntityByName("Button3", "Widgets");
        propPane.TogglePropertyState("disabled", "On");
        agHelper.AssertElementEnabledDisabled(".bp3-button", 1, false);
        propPane.TogglePropertyState("disabled", "Off");
        agHelper.AssertElementEnabledDisabled(".bp3-button", 1, true);

    })
    it("2. Verify placeholder", function () {
        entityExplorer.SelectEntityByName("TreeSelect1", "Widgets");
        propPane.UpdatePropertyFieldValue("Options", "");
        propPane.UpdatePropertyFieldValue("Placeholder", "Select new option");
        agHelper.AssertText(".rc-tree-select-selection-placeholder", "text", "Select new option");
        // Binding with Text widget
        entityExplorer.DragDropWidgetNVerify("textwidget", 550, 400);
        propPane.UpdatePropertyFieldValue("Text", "Select value");
        entityExplorer.SelectEntityByName("TreeSelect1", "Widgets");
        propPane.UpdatePropertyFieldValue("Placeholder", "{{Text2.text}}");
        agHelper.AssertText(".rc-tree-select-selection-placeholder", "text", "Select value");
    })

    it("3. Verify expand all by default", function () {  
        propPane.UpdatePropertyFieldValue("Options", options);
        propPane.TogglePropertyState("expandallbydefault", "On");
        agHelper.GetNClick(".t--widget-singleselecttreewidget");
        agHelper.AssertElementExist(locators._dropDownMultiTreeValue("Dark Blue"))
    })

    it("4. Verify Full color picker and font size", () => {
        // Verify font color picker opens up
        propPane.MoveToTab("Style");
        agHelper.GetNClick(propPane._propertyControlColorPicker("fontcolor"));
        agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
        // Verify full color picker
        agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
        propPane.TogglePropertyState("fontcolor", "On");
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
        agHelper.AssertAttribute(locators._label, 'font-style', 'BOLD');
        agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
        propPane.ToggleJSMode("emphasis", true);
        propPane.UpdatePropertyFieldValue("Emphasis", "ITALIC");
        agHelper.AssertAttribute(locators._label, 'font-style', 'ITALIC');

        // Preview mode
        agHelper.GetNClick(locators._enterPreviewMode);
        agHelper.AssertAttribute(locators._label, 'font-style', 'ITALIC');
        agHelper.GetNClick(locators._exitPreviewMode);

        // Deploy mode
        deployMode.DeployApp();
        agHelper.AssertAttribute(locators._label, 'font-style', 'ITALIC');
        deployMode.NavigateBacktoEditor();

        // entityExplorer.SelectEntityByName("Form1");
        entityExplorer.SelectEntityByName("TreeSelect1", "Form1");
        propPane.MoveToTab("Style");

        // Verify border
        agHelper.GetNClick(propPane._segmentedControl("0px"));
        agHelper.AssertCSS(".rc-tree-select", "border-radius", "0px");
    })
})