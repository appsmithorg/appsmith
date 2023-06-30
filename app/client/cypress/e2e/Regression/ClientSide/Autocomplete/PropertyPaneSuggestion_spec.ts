import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Property Pane Suggestions", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "/");
    agHelper.Sleep(500);
    agHelper.GetNAssertElementText(
      locators._hints,
      "New binding",
      "have.text",
      0,
    );
    agHelper.GetNClickByContains(locators._hints, "New binding");
    propPane.ValidatePropertyFieldValue("Label", "{{}}");

    //typing {{}}
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{");
    agHelper.Sleep(500);
    agHelper.GetNAssertElementText(locators._hints, "appsmith");
    agHelper.GetNClickByContains(locators._hints, "appsmith");
    propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });

  it("2. [Bug]-[2040]: undefined binding on / command dropdown", () => {
    // Create js object
    jsEditor.CreateJSObject("");
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "/");
    agHelper.Sleep(500);
    agHelper.GetNAssertElementText(
      locators._hints,
      "JSObject1",
      "have.text",
      3,
    );
  });

  it("3. Should add Autocomplete Suggestions on Tab press", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{");
    agHelper.Sleep(500);
    agHelper.GetNAssertElementText(locators._hints, "appsmith");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cy.get("body").tab();

    propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
