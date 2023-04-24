import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators, EntityExplorer, PropertyPane } =
  ObjectsRegistry;

describe("Property Pane Suggestions", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should show Property Pane Suggestions on / command & when typing {{}}", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "/");
    AggregateHelper.GetNAssertElementText(CommonLocators._hints, "Bind Data");
    AggregateHelper.GetNAssertElementText(
      CommonLocators._hints,
      "New Binding",
      "have.text",
      1,
    );
    AggregateHelper.GetNClickByContains(CommonLocators._hints, "New Binding");
    PropertyPane.ValidatePropertyFieldValue("Label", "{{}}");

    //typing {{}}
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{");
    AggregateHelper.GetNAssertElementText(CommonLocators._hints, "appsmith");
    AggregateHelper.GetNClickByContains(CommonLocators._hints, "appsmith");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });

  it("2. Should add Autocomplete Suggestions on Tab press", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{");
    AggregateHelper.GetNAssertElementText(CommonLocators._hints, "appsmith");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cy.get("body").tab();

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
