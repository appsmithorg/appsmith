import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  assertHelper,
  debuggerHelper,
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
  "Category Slider spec",
  { tags: ["@tag.Widget", "@tag.Slider", "@tag.Binding"] },
  () => {
    const options = `[
    {
      "label": "xs",
      "value": "xs"
    },
    {
      "label": "sm",
      "value": "sm"
    },
    {
      "label": "md",
      "value": "md"
    },
    {
      "label": "lg",
      "value": "lg"
    },
    {
      "label": "xl",
      "value": "xl"
    }
  ]`;
    before(() => {
      entityExplorer.DragDropWidgetNVerify("categorysliderwidget", 550, 100);
      entityExplorer.DragDropWidgetNVerify("textwidget", 300, 300);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{CategorySlider1.value}}");
    });

    it("1. Validates Default Value", () => {
      // open the Property Pane
      EditorNavigation.SelectEntityByName("CategorySlider1", EntityType.Widget);

      propPane.UpdatePropertyFieldValue("Default value", "mdx");

      agHelper.VerifyEvaluatedErrorMessage(
        "Default value is missing in options. Please update the value.",
      );

      propPane.UpdatePropertyFieldValue("Default value", "");

      agHelper.VerifyEvaluatedErrorMessage(
        "Default value is missing in options. Please update the value.",
      );

      propPane.UpdatePropertyFieldValue("Default value", "md");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      // Assert Text widget has value md
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("md");
        });
    });

    it("2. Change Step Size and check if value changes", () => {
      // open the Property Pane
      EditorNavigation.SelectEntityByName("CategorySlider1", EntityType.Widget);

      // Change the slider value
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");

      agHelper.Sleep(1000);
      // Assert the Text widget has value 20
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("lg");
        });

      // Change the slider value
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{leftArrow}");

      agHelper.Sleep(1000);

      // Assert the Text widget has value 0
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("sm");
        });
    });

    it("3. Does not crash if an invalid mark option is passed", function () {
      propPane.EnterJSContext("Options", "[[]]");
      assertHelper.AssertContains(
        "Oops, Something went wrong.",
        "not.exist",
        locators._widgetByName("CategorySlider1"),
      );
    });

    it("4. Verify Range slider visibility in explorer", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "Category");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("categorysliderwidget"),
      );
      agHelper.ClearTextField(locators._entityExplorersearch);
      agHelper.TypeText(locators._entityExplorersearch, "slider");
      agHelper.AssertElementExist(
        locators._widgetPageIcon("categorysliderwidget"),
      );
    });

    it("5. Verify property visibility", () => {
      EditorNavigation.SelectEntityByName("CategorySlider1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Options", options);
      const dataSectionProperties = ["options", "defaultvalue"];
      const generalProperties = [
        "showmarks",
        "visible",
        "disabled",
        "animateloading",
      ];
      const eventsProperties = ["onchange"];

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
    });

    it("6. Data section Options tests", () => {
      propPane.MoveToTab("Content");
      propPane.ToggleJSMode("options", false);
      // User should be able to add and delete options
      agHelper.GetElementLength(propPane._placeholderName).then((len) => {
        agHelper.GetNClick(propPane._addOptionProperty);
        agHelper.RemoveCharsNType(propPane._placeholderName, -1, "xxl", 5);
        agHelper.RemoveCharsNType(propPane._placeholderValue, -1, "xxl", 5);
        // Verify option added
        agHelper.AssertElementLength(propPane._placeholderName, len + 1);
        agHelper.Sleep(); // Wait for the element to settle to delete it
        // Delete option
        agHelper.GetNClick(propPane._optionsDeleteButton, 5, true);
        agHelper.Sleep(); // Wait for the element to be deleted
        // Verify option deleted
        agHelper.AssertElementLength(propPane._placeholderName, len);

        // Verify slider is divided according to options
        agHelper.GetElementLength(propPane._sliderMark).then((mark) => {
          expect(mark).to.eq(len);
        });
        for (let i = len - 1; i >= 1; i--) {
          agHelper.GetNClick(propPane._optionsDeleteButton, i);
        }
        agHelper.AssertAttribute(
          debuggerHelper.locators._errorCount,
          "kind",
          "error",
        );
      });
    });

    it("7. General section properties tests", () => {
      // Verify Show marks toggle
      propPane.ToggleJSMode("options");
      propPane.UpdatePropertyFieldValue("Options", options);
      agHelper.AssertContains("md", "be.visible", "p");
      propPane.TogglePropertyState("showmarks", "Off");
      agHelper.AssertContains("md", "not.exist", "p");
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

    it("8. Events section onChange tests", () => {
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
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verifying onChange in Deploy mode
      deployMode.DeployApp();
      agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.NavigateBacktoEditor();
    });

    it("9. Verify size change and color change", () => {
      EditorNavigation.SelectEntityByName("CategorySlider1", EntityType.Widget);
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

    it("10. Verify Slider value change using left, right, up and down arrows", () => {
      // Verify in Preview mode
      // Verify slides left with left and down arrow
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("xs");
        });

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("md");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      //Verify in Deploy mode
      deployMode.DeployApp();

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("xs");
        });

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("md");
        });

      deployMode.NavigateBacktoEditor();
    });

    it("11. Verify various modes", () => {
      //agHelper.SetCanvasViewportWidth(375);
      // Verify in Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("xs");
        });

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("md");
        });
      agHelper.GetNClick(locators._exitPreviewMode);

      // Verify in Deploy mode
      deployMode.DeployApp();

      // Verify slides left with left and down arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{leftArrow}")
        .type("{downArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();

      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("xs");
        });

      // Verify slides right with right and up arrow
      agHelper
        .GetElement(locators._sliderThumb)
        .focus()
        .type("{rightArrow}")
        .type("{upArrow}");

      agHelper.Sleep(1000);
      agHelper.ValidateToastMessage("Value Changed");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper
        .GetText(getWidgetSelector(draggableWidgets.TEXT))
        .then(($label) => {
          expect($label).to.eq("md");
        });

      deployMode.NavigateBacktoEditor();
    });
  },
);
