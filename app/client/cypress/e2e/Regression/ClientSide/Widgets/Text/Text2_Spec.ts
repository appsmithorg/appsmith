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
  "Text widget tests",
  { tags: ["@tag.Widget", "@tag.Text", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
    });

    it("1. Validate binding text widget to checkbox and using HTML in Text", () => {
      agHelper.AssertContains(
        "Hello ",
        "be.visible",
        locators._widgetInCanvas(draggableWidgets.TEXT),
      );
      propPane.ValidatePropertyFieldValue(
        "Text",
        "Hello {{appsmith.user.name || appsmith.user.email}}",
      );
      propPane.UpdatePropertyFieldValue("Text", "<br>sample text");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "sample text",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{CheckboxGroup1.options}}");
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.CHECKBOXGROUP,
        300,
        450,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        '[  {    "label": "Blue",    "value": "BLUE"  },  {    "label": "Green",    "value": "GREEN"  },  {    "label": "Red",    "value": "RED"  }]',
      );
    });

    it("2. Verify Visible property", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Visible", "true");
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.TEXT),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "", false);
      propPane.ToggleJSMode("Visible", false);
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.TEXT),
      );
    });

    it("3. Verify Disabled link property is JS convertible", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Disable link", "false");
      propPane.UpdatePropertyFieldValue("Text", "https://docs.appsmith.com/");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertElementVisibility(
        widgetLocators.textWidgetLink("https://docs.appsmith.com/"),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.EnterJSContext(
        "Disable link",
        "{{(45>55)?false:true}}",
        true,
        true,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertElementAbsence(
        widgetLocators.textWidgetLink("https://docs.appsmith.com/"),
      );
    });

    it("4. Verify Height property", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Auto Height");
      propPane.AssertPropertiesDropDownValues("Height", [
        "Auto Height",
        "Auto Height with limits",
        "Fixed",
      ]);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.AssertCSS(
        getWidgetSelector(draggableWidgets.TEXT),
        "height",
        "50px",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");
      agHelper.AssertElementExist(locators._autoHeightOverlay);
      agHelper.AssertElementExist(locators._autoHeightHandles);
      agHelper.AssertElementVisibility(locators._autoHeightMin);
      agHelper.AssertElementVisibility(locators._autoHeightMax);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
    });

    it("5. Verify text widget styles", function () {
      propPane.MoveToTab("Style");
      //General
      propPane.AssertPropertiesDropDownCurrentValue(
        "Font family",
        "System Default",
      );
      propPane.SelectPropertiesDropDown("Font family", "Poppins");
      propPane.AssertPropertiesDropDownCurrentValue("Font size", "M");
      propPane.SelectPropertiesDropDown("Font size", "S");
      //color
      propPane.SelectColorFromColorPicker("textcolor", 12);
      propPane.SelectColorFromColorPicker("backgroundcolor", 9);
      propPane.SelectColorFromColorPicker("bordercolor", 6);
      //text formatting
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      agHelper.GetNClick(locators._alignment("RIGHT"));
      //Border and shadow
      propPane.UpdatePropertyFieldValue("Border width", "24");

      agHelper
        .GetWidgetCSSFrAttribute(
          widgetLocators.textWidgetContainer + " > div > div",
          "color",
        )
        .then((textColor: any) => {
          agHelper
            .GetWidgetCSSFrAttribute(
              widgetLocators.textWidgetContainer + " > div > div",
              "background",
            )
            .then((backgroundColor: any) => {
              agHelper
                .GetWidgetCSSFrAttribute(
                  widgetLocators.textWidgetContainer,
                  "border-color",
                )
                .then((borderColor: any) => {
                  deployMode.DeployApp(
                    locators._widgetInDeployed(draggableWidgets.TEXT),
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer + " > div > div",
                    "color",
                    textColor,
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer + " > div > div",
                    "background",
                    backgroundColor,
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer,
                    "border-color",
                    borderColor,
                  );
                });
            });
        });
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div",
        "font-family",
        "Poppins",
      );
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div > div",
        "font-size",
        "14px",
      );
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div > div",
        "font-weight",
        "400",
      );
      agHelper.AssertAttribute(
        widgetLocators.textWidgetContainer + " > div > div",
        "textalign",
        "RIGHT",
      );
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer,
        "border-width",
        "24px",
      );
    });

    it("6. Verify text widget styles are JS convertible", function () {
      //JS conversion
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Font family", "Inter");
      propPane.EnterJSContext("Font size", "1.5rem");
      propPane.EnterJSContext("Text color", "#71717a");
      propPane.EnterJSContext("Background color", "#fca5a5");
      propPane.EnterJSContext("Alignment", "LEFT");
      propPane.EnterJSContext("Emphasis", "ITALIC");
      agHelper
        .GetWidgetCSSFrAttribute(
          widgetLocators.textWidgetContainer + " > div > div",
          "color",
        )
        .then((textColor: any) => {
          agHelper
            .GetWidgetCSSFrAttribute(
              widgetLocators.textWidgetContainer + " > div > div",
              "background",
            )
            .then((backgroundColor: any) => {
              deployMode.DeployApp(
                locators._widgetInDeployed(draggableWidgets.TEXT),
              );
              agHelper.AssertCSS(
                widgetLocators.textWidgetContainer + " > div > div",
                "color",
                textColor,
              );
              agHelper.AssertCSS(
                widgetLocators.textWidgetContainer + " > div > div",
                "background",
                backgroundColor,
              );
            });
        });
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div",
        "font-family",
        "Inter",
      );
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div > div",
        "font-size",
        "24px",
      );
      agHelper.AssertCSS(
        widgetLocators.textWidgetContainer + " > div > div",
        "font-style",
        "italic",
      );
      agHelper.AssertAttribute(
        widgetLocators.textWidgetContainer + " > div > div",
        "textalign",
        "LEFT",
      );
    });

    it("7. Pick color using Full color picker", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.ToggleJSMode("Background color", false);
      propPane.ToggleJSMode("Text color", false);
      propPane.TogglePropertyState("Full color picker", "On");
      agHelper.GetNClick(propPane._propertyControlColorPicker("textcolor"));
      agHelper.GetNClick(
        propPane._propertyControlColorPicker("backgroundcolor"),
      );
      agHelper.GetNClick(propPane._propertyControlColorPicker("bordercolor"));
      agHelper
        .GetWidgetCSSFrAttribute(
          widgetLocators.textWidgetContainer + " > div > div",
          "color",
        )
        .then((textColor: any) => {
          agHelper
            .GetWidgetCSSFrAttribute(
              widgetLocators.textWidgetContainer + " > div > div",
              "background",
            )
            .then((backgroundColor: any) => {
              agHelper
                .GetWidgetCSSFrAttribute(
                  widgetLocators.textWidgetContainer,
                  "border-color",
                )
                .then((borderColor: any) => {
                  deployMode.DeployApp(
                    locators._widgetInDeployed(draggableWidgets.TEXT),
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer + " > div > div",
                    "color",
                    textColor,
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer + " > div > div",
                    "background",
                    backgroundColor,
                  );
                  agHelper.AssertCSS(
                    widgetLocators.textWidgetContainer,
                    "border-color",
                    borderColor,
                  );
                });
            });
        });
    });

    it("8. Validate renaming, duplication(copy, paste) & deletion of text widget", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //Rename widget
      propPane.RenameWidget("Text1", "Text_Widget");
      agHelper.AssertContains(
        "Text_Widget",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      agHelper.GetNClick(locators._widgetInCanvas(draggableWidgets.TEXT));

      //Duplicate with hotkeys
      entityExplorer.CopyPasteWidget("Text_Widget");
      agHelper.ValidateToastMessage("Copied Text_Widget");
      agHelper.AssertContains(
        "Text_WidgetCopy",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.TEXT))
        .should("have.length", 2);
      deployMode.NavigateBacktoEditor();

      //Duplicate from property pane
      EditorNavigation.SelectEntityByName("Text_WidgetCopy", EntityType.Widget);
      propPane.CopyPasteWidgetFromPropertyPane("Text_WidgetCopy");
      agHelper.ValidateToastMessage("Copied Text_WidgetCopy");
      agHelper.AssertContains(
        "Text_WidgetCopyCopy",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.TEXT))
        .should("have.length", 3);
      deployMode.NavigateBacktoEditor();

      //Delete widget from property pane
      propPane.DeleteWidgetFromPropertyPane("Text_WidgetCopyCopy");

      //Delete widget using hotkeys
      EditorNavigation.SelectEntityByName("Text_WidgetCopy", EntityType.Widget);
      agHelper.PressDelete();
      agHelper.AssertContains(
        "Text_WidgetCopyCopy",
        "not.exist",
        widgetLocators.widgetNameTag,
      );
      agHelper.AssertContains(
        "Text_WidgetCopy",
        "not.exist",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.TEXT))
        .should("have.length", 1);
    });
  },
);
