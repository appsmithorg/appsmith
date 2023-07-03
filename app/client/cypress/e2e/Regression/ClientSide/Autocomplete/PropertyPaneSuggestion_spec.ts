import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Property Pane Suggestions", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
  });

  it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "/");
    agHelper.Sleep(500);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "New binding");
    agHelper.GetNClickByContains(locators._hints, "New binding");
    propPane.ValidatePropertyFieldValue("Label", "{{}}");

    //typing {{}}
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{");
    agHelper.Sleep(500);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "appsmith");
    agHelper.GetNClickByContains(locators._hints, "appsmith");
    propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });

  it("2. [Bug]-[2040]: undefined binding on / command dropdown", () => {
    // Create js object
    jsEditor.CreateJSObject("");
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "/");
    agHelper.Sleep(500);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "JSObject1");
  });

  it("3. Should add Autocomplete Suggestions on Tab press", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{");
    agHelper.Sleep(500);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "appsmith");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cy.get("body").tab();
    propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
