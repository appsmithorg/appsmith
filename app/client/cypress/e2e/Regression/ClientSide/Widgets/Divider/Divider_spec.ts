import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Divider Widget functionality tests",
  { tags: ["@tag.Widget", "@tag.Divider"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.DIVIDER, 200, 200);
    });

    it("1. Divider widget Visiblity property verification", () => {
      propPane.TogglePropertyState("Visible", "Off");
      // verify in deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.DIVIDER),
      );
      deployMode.NavigateBacktoEditor();
      // verify in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      //verify widget is not present
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.DIVIDER),
      );
      //Exit preview mode
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("2. Divider widget style section verification", () => {
      EditorNavigation.SelectEntityByName("Divider1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Color", "Purple");
      //propPane.SelectColorFromColorPicker("iconcolor", -15);
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-color",
        "rgb(128, 0, 128)",
      );
      propPane.EnterJSContext("Style", "Dotted");
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-style",
        "dotted",
      );
      propPane.UpdatePropertyFieldValue("Thickness", "4");
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-width",
        "4px",
      );
      propPane.EnterJSContext("Cap", "dot");
      propPane.EnterJSContext("Direction", "vertical");
      agHelper.AssertElementAbsence(widgetLocators.dividerHorizontal);
      agHelper.Sleep(1000);
    });

    it("3. Bind style properties of divider to radio widget and verify ", () => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.RADIO_GROUP,
        400,
        400,
      );
      EditorNavigation.SelectEntityByName("Divider1", EntityType.Widget);
      propPane.EnterJSContext(
        "Direction",
        "{{RadioGroup1.selectedOptionValue==='Y'?'horizontal':'vertical'}}",
      );
      propPane.EnterJSContext(
        "Color",
        "{{RadioGroup1.selectedOptionValue==='Y'?'#231F20':'#b91c1c'}}",
      );

      propPane.EnterJSContext(
        "Style",
        "{{RadioGroup1.selectedOptionValue==='Y'?'solid':'dotted'}}",
      );
      propPane.EnterJSContext(
        "Cap",
        "{{RadioGroup1.selectedOptionValue==='Y'?'nc':'dot'}}",
      );
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("Yes"),
      );
      agHelper.AssertElementAbsence(widgetLocators.dividerVertical);
      EditorNavigation.SelectEntityByName("Divider1", EntityType.Widget);
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-color",
        "rgb(35, 31, 32)",
      );
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-style",
        "solid",
      );
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
      agHelper.CheckUncheck(locators._checkboxTypeByOption("No"));
      agHelper.AssertElementAbsence(widgetLocators.dividerHorizontal);
      agHelper.AssertCSS(
        widgetLocators.dividerVertical,
        "border-right-color",
        "rgb(185, 28, 28)",
      );
      agHelper.AssertCSS(
        widgetLocators.dividerVertical,
        "border-right-style",
        "dotted",
      );
    });

    it("4. Verify bindings in preview and deploy mode", () => {
      // verify in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(widgetLocators.dividerHorizontal);
      agHelper.AssertCSS(
        widgetLocators.dividerVertical,
        "border-right-color",
        "rgb(185, 28, 28)",
      );
      agHelper.AssertCSS(
        widgetLocators.dividerVertical,
        "border-right-style",
        "dotted",
      );
      //Exit preview mode
      agHelper.GetNClick(locators._exitPreviewMode);
      // Enter view mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(widgetLocators.dividerVertical);
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-color",
        "rgb(35, 31, 32)",
      );
      agHelper.AssertCSS(
        widgetLocators.dividerHorizontal,
        "border-top-style",
        "solid",
      );
    });
  },
);
