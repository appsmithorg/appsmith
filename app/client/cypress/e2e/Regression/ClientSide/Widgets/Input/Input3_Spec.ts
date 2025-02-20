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
  "InputV2 widget tests - continuation",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
    });

    it("1. Validate Required field", function () {
      propPane.TogglePropertyState("Required", "On");
      propPane.UpdatePropertyFieldValue("Default value", "");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.TypeText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "test",
      );
      agHelper.ClearTextField(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      );
      agHelper.AssertPopoverTooltip("This field is required");
    });

    it("2. Validate Max Characters (Single & Multi Line Text)", function () {
      //Single line text input
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Single-line text");
      propPane.UpdatePropertyFieldValue("Max characters", "10");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "Hello! How are you?",
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "Hello! How",
      );

      //Multi line text input
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Multi-line text");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "Hello! How are you?",
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "text",
        "Hello! How",
      );
    });

    it("3. Validate Valid property", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Valid", "{{Input1.text.length > 5}}");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "test",
      );
      agHelper.AssertPopoverTooltip("Invalid input");
    });

    it("4. Validate tooltip & onTextChangedEvent", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Tooltip", "Input tooltip");
      propPane.EnterJSContext(
        "onTextChanged",
        "{{showAlert('Text changed!','success')}}",
        true,
      );

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("Input tooltip");
      agHelper.AssertCSS(locators._tooltipIcon, "overflow", "hidden");
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "test",
      );
      agHelper.ValidateToastMessage("Text changed!");
    });

    it("5. Validate showStepArrows for number input", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Number");
      agHelper.AssertElementAbsence(widgetLocators.inputWidgetStepUp);
      agHelper.AssertElementAbsence(widgetLocators.inputWidgetStepDown);
      propPane.TogglePropertyState("Show step arrows", "On");
      propPane.UpdatePropertyFieldValue("Min", "-1");
      propPane.UpdatePropertyFieldValue("Max", "10");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertElementVisibility(widgetLocators.inputWidgetStepUp);
      agHelper.AssertElementVisibility(widgetLocators.inputWidgetStepDown);

      //Step arrows are disabled when input value equals max value or min value
      agHelper.TypeText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "10",
      );
      agHelper.AssertClassExists(
        widgetLocators.inputWidgetStepUp,
        "bp3-disabled",
      );
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "-1",
      );
      agHelper.AssertClassExists(
        widgetLocators.inputWidgetStepDown,
        "bp3-disabled",
      );

      //Validate functionality of arrows
      agHelper.GetNClick(widgetLocators.inputWidgetStepUp);
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "0",
      );
      agHelper.GetNClick(widgetLocators.inputWidgetStepDown);
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "-1",
      );
    });

    it("6. Verify Input widget styles", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.SelectColorFromColorPicker("fontcolor", 11);
      propPane.SelectPropertiesDropDown("Font size", "M");
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      agHelper.ContainsNClick("Medium");
      agHelper.GetNClick(locators._borderRadius("1.5rem"));
      agHelper
        .GetWidgetCSSFrAttribute(widgetLocators.inputWidgetLabel, "color")
        .then((color) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.INPUT_V2),
          );
          agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "color", color);
          agHelper.AssertCSS(
            widgetLocators.inputWidgetLabel,
            "font-size",
            "16px",
          );
          agHelper.AssertCSS(
            widgetLocators.inputWidgetLabel,
            "font-weight",
            "700",
          );
        });
      agHelper.AssertCSS(
        widgetLocators.inputWidgetWrapper,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetWrapper,
        "border-radius",
        "24px",
      );

      //JS conversion
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
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
        .GetWidgetCSSFrAttribute(widgetLocators.inputWidgetLabel, "color")
        .then((color) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.INPUT_V2),
          );
          agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "color", color);
          agHelper.AssertCSS(
            widgetLocators.inputWidgetLabel,
            "font-size",
            "20px",
          );
          agHelper.AssertCSS(
            widgetLocators.inputWidgetLabel,
            "font-style",
            "italic",
          );
        });
      agHelper.AssertCSS(
        widgetLocators.inputWidgetWrapper,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetWrapper,
        "border-radius",
        "16px",
      );
    });
  },
);
