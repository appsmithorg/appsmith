import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Property Pane Suggestions",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "/");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "Add a binding");
      agHelper.GetNClickByContains(locators._hints, "Add a binding");
      propPane.ValidatePropertyFieldValue("Label", "{{}}");

      //typing {{}}
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "{{");
      agHelper.GetElementsNAssertTextPresence(
        locators._hints,
        "Button1.isVisible",
      );
      agHelper.GetNClickByContains(locators._hints, "Button1.isVisible");
      propPane.ValidatePropertyFieldValue("Label", "{{Button1.isVisible}}");
    });

    it("2. [Bug]-[2040]: undefined binding on / command dropdown", () => {
      // Create js object
      jsEditor.CreateJSObject("");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "/");
      agHelper.GetElementsNAssertTextPresence(
        locators._slashCommandHintText,
        "JSObject1",
      );
    });

    it("3. Should add Autocomplete Suggestions on Tab press", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "{{J");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "JSObject1");
      cy.get("body").tab();
      propPane.ValidatePropertyFieldValue("Label", "{{JSObject1}}");
    });
  },
);
