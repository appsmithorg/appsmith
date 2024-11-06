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
  "Number Slider spec",
  { tags: ["@tag.Widget", "@tag.Slider", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("numbersliderwidget", 550, 100);
      entityExplorer.DragDropWidgetNVerify("textwidget", 300, 300);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{NumberSlider1.value}}");
    });

    it("1. Verify property visibility and default values", () => {
      const dataSectionProperties = [
        "min\\.value",
        "max\\.value",
        "stepsize",
        "defaultvalue",
      ];
      const generalProperties = [
        "showmarks",
        "marks",
        "visible",
        "disabled",
        "animateloading",
        "showvaluealways",
      ];
      const eventsProperties = ["onchange"];

      EditorNavigation.SelectEntityByName("NumberSlider1", EntityType.Widget);
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
      //Style Section properties
      propPane.MoveToTab("Style");
      agHelper.AssertElementVisibility(propPane._propertyControl("size"));
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
        .EvaluateExistingPropertyFieldValue("Default value")
        .then((val: any) => {
          expect(val).to.eq("10");
        });
    });

    it("2. Validates accepted and unaccepted 'Min. value' values", () => {
      propPane.UpdatePropertyFieldValue("Min. value", "110");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than max value",
      );

      propPane.UpdatePropertyFieldValue("Min. value", "");

      agHelper.VerifyEvaluatedErrorMessage("This value is required");

      propPane.UpdatePropertyFieldValue("Min. value", "zero");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      // Allows negative value and validate
      propPane.UpdatePropertyFieldValue("Min. value", "-10");
      propPane.UpdatePropertyFieldValue("Step size", "10");

      // Verify in Preview mode negative value
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{leftArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("-10");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode negative value
      deployMode.DeployApp();
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}{leftArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("-10");
        });
      deployMode.NavigateBacktoEditor();

      // Allows decimal value
      EditorNavigation.SelectEntityByName("NumberSlider1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Min. value", "10.5");

      // Verify Decimal value
      agHelper.GetElement(locators._sliderThumb).focus().type("{leftArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("10.5");
        });
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
      propPane.UpdatePropertyFieldValue("Step size", "90");
      // Verify decimal value
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("100.5");
        });

      // Accepts negative value
      propPane.UpdatePropertyFieldValue("Min. value", "-50");
      propPane.UpdatePropertyFieldValue("Max. value", "-30");

      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("-30");
        });

      // Verify in Preview mode negative value
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text")
        .then(($label) => {
          expect($label).to.eq("-30");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode negative value
      deployMode.DeployApp();
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.Sleep(2000);
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT), "text", 0)
        .then(($label) => {
          expect($label).to.eq("-30");
        });
      deployMode.NavigateBacktoEditor();
    });

    it("4. Validate accepted and unaccepted 'Step Value' values", () => {
      EditorNavigation.SelectEntityByName("NumberSlider1", EntityType.Widget);

      propPane.UpdatePropertyFieldValue("Step size", "-10");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than 0.1",
      );

      propPane.UpdatePropertyFieldValue("Step size", "110");

      agHelper.VerifyEvaluatedErrorMessage("This value must be less than 20");

      propPane.UpdatePropertyFieldValue("Step size", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Step size", "10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("5. Validates accepted and unaccepted 'Default Value' values", () => {
      propPane.UpdatePropertyFieldValue("Max. value", "100");
      propPane.UpdatePropertyFieldValue("Min. value", "10");
      propPane.UpdatePropertyFieldValue("Default value", "-10");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be greater than or equal to the min value",
      );

      propPane.UpdatePropertyFieldValue("Default value", "110");

      agHelper.VerifyEvaluatedErrorMessage(
        "This value must be less than or equal to the max value",
      );

      propPane.UpdatePropertyFieldValue("Default value", "asd");

      agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

      propPane.UpdatePropertyFieldValue("Default value", "10");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    });

    it("6. Change Step size and check if value changes", () => {
      // Assert Text widget has value 10
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });

      // Change the slider value
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .wait(500);

      agHelper.Sleep(2000); //for the changes to reflect in text widget

      // Assert the Text widget has value 20
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("20");
        });

      // Change the slider value
      agHelper.GetElement(locators._sliderThumb).focus().type("{leftArrow}");

      agHelper.Sleep(2000); //for the changes to reflect in text widget
      // Assert the Text widget has value 0
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });
    });

    it("7. Verify Range slider visibility in explorer", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "Number");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("numbersliderwidget"),
      );
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "slider");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("numbersliderwidget"),
      );
    });

    it("8. Validate 'show marks', 'visible' and 'disable' toggle", () => {
      EditorNavigation.SelectEntityByName("NumberSlider1", EntityType.Widget);

      // Verify Show marks toggle
      agHelper.AssertContains("50%", "be.visible", "p");
      propPane.TogglePropertyState("showmarks", "Off");
      agHelper.AssertContains("50%", "not.exist", "p");
      // Verify Disabled toggle
      propPane.TogglePropertyState("disabled", "On");
      agHelper.AssertAttribute(locators._sliderThumb, "disabled", "disabled");
      propPane.TogglePropertyState("disabled", "Off");
      // Verify Visible toggle
      propPane.TogglePropertyState("visible", "Off");
      agHelper.AssertExistingToggleState("visible", "false");
      propPane.TogglePropertyState("visible", "On");
      agHelper.AssertExistingToggleState("visible", "true");
    });

    it("9. Validate Events section onChange tests", () => {
      // Verify Events onChange
      propPane.SelectPlatformFunction("onChange", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Value Changed",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      // Change the slider value
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.ValidateToastMessage("Value Changed");

      // Verify in Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verifying onChange in Deploy mode
      deployMode.DeployApp();
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.ValidateToastMessage("Value Changed");
      deployMode.NavigateBacktoEditor();
    });

    it("10.  Verify size change and color change", () => {
      EditorNavigation.SelectEntityByName("NumberSlider1", EntityType.Widget);
      propPane.MoveToTab("Style");
      // Verify Size
      agHelper
        .GetWidgetCSSHeight(locators._sliderThumb)
        .then((initialHeight) => {
          agHelper.GetNClick(propPane._styleSize("s"));
          agHelper
            .GetWidgetCSSHeight(locators._sliderThumb)
            .then((currentHeight) => {
              expect(initialHeight).to.not.eq(currentHeight);
            });
        });

      // Verify Color
      agHelper
        .GetWidgetCSSFrAttribute(locators._sliderThumb, "background-color")
        .then((sliderColor) => {
          agHelper.GetNClick(
            propPane._propertyPanePropertyControl("color", "fillcolor"),
          );
          agHelper
            .GetWidgetCSSFrAttribute(propPane._themeColor, "background-color")
            .then((themeColor) => {
              expect(sliderColor).to.eq(themeColor);
            });
        });

      // Select color and verify
      propPane.SelectColorFromColorPicker("fillcolor", 10);
      agHelper
        .GetWidgetCSSFrAttribute(locators._sliderThumb, "background-color")
        .then((sliderColor) => {
          agHelper
            .GetWidgetCSSFrAttribute(
              `${propPane._propertyControlSelectedColorButton("fillcolor")}`,
              "background-color",
            )
            .then((newColor) => {
              expect(sliderColor).to.eq(newColor);
            });
        });
    });

    it("11. Verify Slider value change using left, right, up and down arrows", () => {
      // Verify in Preview mode
      // Verify slides right with right and up arrow
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(200);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("30");
        });

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(200);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });

      agHelper.GetNClick(locators._exitPreviewMode);

      //Verify in Deploy mode
      deployMode.DeployApp();

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep();

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("30");
        });

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });

      deployMode.NavigateBacktoEditor();
    });

    it("12. Verify various modes", () => {
      // Verify in Preview mode
      // Verify slides right with right and up arrow
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("30");
        });

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });

      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode
      deployMode.DeployApp();

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("30");
        });

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("10");
        });

      deployMode.NavigateBacktoEditor();
    });
  },
);
