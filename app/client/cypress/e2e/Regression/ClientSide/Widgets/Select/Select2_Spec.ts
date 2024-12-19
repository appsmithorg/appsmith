import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Select widget tests",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT);
    });

    it("1. Validate Label properties - Text , Position , Alignment , Width(in columns)", function () {
      //Text
      propPane.TypeTextIntoField("Text", "Select Value");

      //Position
      agHelper.AssertAttribute(
        locators._position("Top"),
        "data-selected",
        "true",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetLabel,
        "margin-bottom",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetLabel,
        "margin-right",
        "0px",
      );
      agHelper.GetNClick(locators._position("Left"));

      //Alignment
      agHelper.AssertAttribute(
        locators._alignment("left"),
        "data-selected",
        "true",
      );
      agHelper.GetNClick(locators._alignment("right"));

      agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);
      agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.AssertCSS(
        widgetLocators.selectWidgetLabel,
        "margin-bottom",
        "0px",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetLabel,
        "margin-right",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetLabel,
        "text-align",
        "right",
      );
      agHelper.AssertText(
        widgetLocators.selectWidgetLabel,
        "text",
        "Select Value",
      );
    });

    it("2. When user selects another option the previous selected option is removed and update with current selection", function () {
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($selectedValue).to.eq("Green");
      });
      agHelper.SelectDropDown("Blue");
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($selectedValue).to.eq("Blue");
        expect($selectedValue).not.to.contain("Green");
      });
    });

    it("3. Validate tooltip and placeholder", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Tooltip", "{{Input1.text}}");
      propPane.UpdatePropertyFieldValue("Placeholder", "{{Input1.text}}");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 300, 200);
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.TypeText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "Input text",
      );
      agHelper.GetNClick(widgetLocators.selectWidgetClear);
      agHelper.AssertContains(
        "Input text",
        "be.visible",
        widgetLocators.selectWidgetBtn,
      );
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("Input text");
    });

    it("4. Verify Visible property", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Visible", "true");
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.SELECT),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "", false);
      propPane.ToggleJSMode("Visible", false);
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.SELECT),
      );
    });

    it("5. Verify Disabled property", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Disabled", "false");
      propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementEnabledDisabled(
        widgetLocators.selectWidgetBtn,
        0,
        true,
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.EnterJSContext("Disabled", "", false);
      propPane.ToggleJSMode("Disabled", false);
      propPane.TogglePropertyState("Disabled", "Off");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper
        .GetElement(widgetLocators.selectWidgetBtn)
        .should("not.have.attr", "disabled");
    });

    it("6. Verify Height property", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Fixed");
      propPane.AssertPropertiesDropDownValues("Height", [
        "Auto Height",
        "Auto Height with limits",
        "Fixed",
      ]);
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.AssertCSS(
        getWidgetSelector(draggableWidgets.SELECT),
        "height",
        "40px",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");
      agHelper.AssertElementExist(locators._autoHeightOverlay);
      agHelper.AssertElementExist(locators._autoHeightHandles);
      agHelper.AssertElementVisibility(locators._autoHeightMin);
      agHelper.AssertElementVisibility(locators._autoHeightMax);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
    });

    it("7. Validate OnOptionChange , OnDropdownOpen , OnDropdownClose events are JS convertible", () => {
      propPane.EnterJSContext(
        "onOptionChange",
        "{{showAlert('Option changed!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onOptionChange", false);
      propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('Dropdown opened!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onDropdownOpen", false);
      propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('Dropdown closed!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onDropdownClose", false);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.ValidateToastMessage("Dropdown opened!");
      agHelper.AssertElementVisibility(
        locators._selectOptionValue("Red"),
        true,
      );
      agHelper.GetNClick(locators._selectOptionValue("Red"));
      agHelper.ValidateToastMessage("Dropdown closed!");
      agHelper.ValidateToastMessage("Option changed!");
    });

    it("8. Verify select widget styles", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.SelectColorFromColorPicker("fontcolor", 9);
      propPane.SelectPropertiesDropDown("Font size", "M");
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      agHelper.ContainsNClick("Medium");
      agHelper.GetNClick(locators._borderRadius("1.5rem"));
      agHelper
        .GetWidgetCSSFrAttribute(widgetLocators.selectWidgetLabel, "color")
        .then((color) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.SELECT),
          );
          agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "color", color);
          agHelper.AssertCSS(
            widgetLocators.selectWidgetLabel,
            "font-size",
            "16px",
          );
          agHelper.AssertCSS(
            widgetLocators.selectWidgetLabel,
            "font-weight",
            "700",
          );
        });
      agHelper.AssertCSS(
        widgetLocators.selectWidgetBtn,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetBtn,
        "border-radius",
        "24px",
      );

      //JS conversion
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Font color", "#22c55e");
      propPane.EnterJSContext("Font size", "1.25rem");
      agHelper.GetNClick(propPane._emphasisSelector("ITALIC"));
      propPane.EnterJSContext("Border radius", "1rem");
      propPane.EnterJSContext(
        "Box shadow",
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      );
      agHelper
        .GetWidgetCSSFrAttribute(widgetLocators.selectWidgetLabel, "color")
        .then((color) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.SELECT),
          );
          agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "color", color);
          agHelper.AssertCSS(
            widgetLocators.selectWidgetLabel,
            "font-size",
            "20px",
          );
          agHelper.AssertCSS(
            widgetLocators.selectWidgetLabel,
            "font-style",
            "italic",
          );
        });
      agHelper.AssertCSS(
        widgetLocators.selectWidgetBtn,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
      );
      agHelper.AssertCSS(
        widgetLocators.selectWidgetBtn,
        "border-radius",
        "16px",
      );
    });

    it("9. Validate Validation required property", function () {
      deployMode.NavigateBacktoEditor();
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM, 300, 400);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 200, 500);
      EditorNavigation.SelectEntityByName("Select2", EntityType.Widget);
      agHelper.AssertExistingToggleState("Required", "false");
      propPane.TogglePropertyState("Required", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.FORM));
      cy.get(locators._selectClearButton_testId).should("not.exist");
    });
  },
);
