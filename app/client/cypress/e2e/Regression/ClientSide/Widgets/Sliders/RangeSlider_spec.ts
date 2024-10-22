import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Range Slider spec",
  { tags: ["@tag.Widget", "@tag.Slider", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("rangesliderwidget", 550, 100);
      entityExplorer.DragDropWidgetNVerify("textwidget", 300, 300);
      entityExplorer.DragDropWidgetNVerify("textwidget", 600, 300);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{RangeSlider1.end}}");
      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{RangeSlider1.start}}");
    });

    it("1. Verify property visibility and default values", () => {
      const dataSectionProperties = [
        "min\\.value",
        "max\\.value",
        "stepsize",
        "min\\.range",
        "defaultstartvalue",
        "defaultendvalue",
      ];
      const generalProperties = [
        "showmarks",
        "marks",
        "visible",
        "disabled",
        "animateloading",
        "showvaluealways",
      ];
      const eventsProperties = ["onstartvaluechange", "onendvaluechange"];

      EditorNavigation.SelectEntityByName("RangeSlider1", EntityType.Widget);
      // Data Section properties
      dataSectionProperties.forEach((dataSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "data",
            `${dataSectionProperty}`,
          ),
        );
      });
      // General Section Properties
      generalProperties.forEach((generalProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "general",
            `${generalProperty}`,
          ),
        );
      });
      // Events Section properties
      eventsProperties.forEach((eventsProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl("events", `${eventsProperty}`),
        );
      });
      // Style Section properties
      propPane.MoveToTab("Style");
      propPane._propertyControl("size");
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("color", "fillcolor"),
      );

      propPane.MoveToTab("Content");
      // Verify default value
      propPane
        .EvaluateExistingPropertyFieldValue("Min. value")
        .then((val: any) => {
          expect(val).to.eq("0");
        });
      propPane
        .EvaluateExistingPropertyFieldValue("Max. value")
        .then((val: any) => {
          expect(val).to.eq("100");
        });
      propPane
        .EvaluateExistingPropertyFieldValue("Step size")
        .then((val: any) => {
          expect(val).to.eq("1");
        });
      propPane
        .EvaluateExistingPropertyFieldValue("Min. range")
        .then((val: any) => {
          expect(val).to.eq("5");
        });
    });

    it("2. Validate accepted and unaccepted 'Min. value' values", () => {
      propPane.UpdatePropertyFieldValue("Min. value", "110");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than max value",
      );

      propPane.UpdatePropertyFieldValue("Min. value", "");

      agHelper.VerifyEvaluatedErrorMessage("This value is required");

      propPane.UpdatePropertyFieldValue("Min. value", "zero");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Min. range", "10");
      propPane.UpdatePropertyFieldValue("Step size", "10");
      propPane.UpdatePropertyFieldValue("Min. value", "-10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

      // Verify in Preview mode negative value
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(0)
        .focus()
        .type("{leftArrow}")
        .type("{leftArrow}")
        .type("{leftArrow}");
      agHelper.Sleep(3000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 1)
        .then(($label) => {
          expect($label).to.eq("-10");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode negative value
      deployMode.DeployApp();
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(0)
        .focus()
        .type("{leftArrow}")
        .type("{leftArrow}");
      agHelper.Sleep(3000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 1)
        .then(($label) => {
          expect($label).to.eq("-10");
        });
      deployMode.NavigateBacktoEditor();

      // Allows decimal value
      EditorNavigation.SelectEntityByName("RangeSlider1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Min. value", "10.5");

      // Verify Decimal value
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(0)
        .focus()
        .type("{leftArrow}");
      agHelper.Sleep(3000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 1)
        .then(($label) => {
          expect($label).to.eq("10.5");
        });
      // Does not allow value greater than Max value
      propPane.UpdatePropertyFieldValue("Min. value", "110");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than max value",
      );
      // Updating to allowed value
      propPane.UpdatePropertyFieldValue("Min. value", "10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("3. Validate accepted and unaccepted 'Max. value' values", () => {
      propPane.UpdatePropertyFieldValue("Max. value", "0");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than min value",
      );

      propPane.UpdatePropertyFieldValue("Max. value", "");

      agHelper.VerifyEvaluatedErrorMessage("This value is required");

      propPane.UpdatePropertyFieldValue("Max. value", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      // Allows decimal value
      propPane.UpdatePropertyFieldValue("Max. value", "100.5");
      // Updating step size to verify Max value
      propPane.UpdatePropertyFieldValue("Step size", "90");
      // Verify decimal value
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(1)
        .focus()
        .type("{rightArrow}");
      agHelper.Sleep(3000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("100.5");
        });

      // Does not allow value less than min value
      propPane.UpdatePropertyFieldValue("Max. value", "-20");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than min value",
      );

      // Accepts negative value
      propPane.UpdatePropertyFieldValue("Min. value", "-50");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      propPane.UpdatePropertyFieldValue("Max. value", "-30");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

      agHelper
        .GetElement(locators._sliderThumb)
        .eq(1)
        .focus()
        .type("{rightArrow}{rightArrow}{rightArrow}");
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("-30");
        });

      // Verify in Preview mode negative value
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(1)
        .focus()
        .type("{rightArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("-30");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode negative value
      deployMode.DeployApp();
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(1)
        .focus()
        .type("{rightArrow}");
      agHelper.Sleep(3000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("-30");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("4. Validate accepted and unaccepted 'Step size' values", () => {
      EditorNavigation.SelectEntityByName("RangeSlider1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Min. range", "5");
      propPane.UpdatePropertyFieldValue("Step size", "10");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than or equal to minRange",
      );

      propPane.UpdatePropertyFieldValue("Step size", "");

      agHelper.VerifyEvaluatedErrorMessage("This value is required");

      propPane.UpdatePropertyFieldValue("Step size", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      // Does not allow value less than 0.1
      EditorNavigation.SelectEntityByName("RangeSlider1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Step size", "0");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than 0.1",
      );
      // Does not allow negative value
      propPane.UpdatePropertyFieldValue("Step size", "-10");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than 0.1",
      );
      propPane.UpdatePropertyFieldValue("Step size", "5");
      // Does not allow value greater than max value
      propPane.UpdatePropertyFieldValue("Max. value", "100");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      propPane.UpdatePropertyFieldValue("Min. value", "10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      propPane.UpdatePropertyFieldValue("Step size", "110");
      agHelper.VerifyEvaluatedErrorMessage("This value must be less than 90");

      // Updating to allowed value
      propPane.UpdatePropertyFieldValue("Step size", "5");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("5. Validate accepted and unaccepted 'Min Range' values", () => {
      propPane.UpdatePropertyFieldValue("Min. range", "0");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than 0.1",
      );

      propPane.UpdatePropertyFieldValue("Min. range", "-10");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than 0.1",
      );

      propPane.UpdatePropertyFieldValue("Min. range", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Min. range", "110");

      agHelper.VerifyEvaluatedErrorMessage("This value must be less than 90");

      // Does not accept value less than step size
      propPane.UpdatePropertyFieldValue("Min. range", "2");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than or equal to step size",
      );

      // Updating to allowed value
      propPane.UpdatePropertyFieldValue("Min. range", "5");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("6. Validate accepted and unaccepted 'Default start' value", () => {
      propPane.UpdatePropertyFieldValue("Default start value", "-100");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than or equal to the min value",
      );

      propPane.UpdatePropertyFieldValue("Default end value", "100");
      propPane.UpdatePropertyFieldValue("Default start value", "110");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than defaultEnd value",
      );

      propPane.UpdatePropertyFieldValue("Default start value", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Default start value", "10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

      //Validate accepted and unaccepted 'Default end' value
      propPane.UpdatePropertyFieldValue("Default end value", "-10");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than defaultStart value",
      );

      propPane.UpdatePropertyFieldValue("Default end value", "110");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than or equal to the max value",
      );

      propPane.UpdatePropertyFieldValue("Default end value", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Default end value", "100");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("7. Change Step size and check if binding value changes", () => {
      // Assert Text widget has value 10
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 1)
        .then(($label) => {
          expect($label).to.eq("10");
        });

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("100");
        });

      // Change the Step size to 10
      propPane.UpdatePropertyFieldValue("Min. range", "10", true, false);
      propPane.UpdatePropertyFieldValue("Step size", "10", true, false);

      agHelper
        .GetElement(locators._sliderThumb)
        .eq(0)
        .focus()
        .type("{rightArrow}")
        .wait(2000);

      // Assert the Text widget has value 20
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 1)
        .then(($label) => {
          expect($label).to.eq("20");
        });

      // Change the slider value
      agHelper
        .GetElement(locators._sliderThumb)
        .eq(1)
        .focus()
        .type("{leftArrow}")
        .type("{leftArrow}");

      agHelper.Sleep(2000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("80");
        });
    });

    it("8. Verify Range slider visibility in explorer", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "Range");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("rangesliderwidget"),
      );
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "slider");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("rangesliderwidget"),
      );
    });
  },
);
