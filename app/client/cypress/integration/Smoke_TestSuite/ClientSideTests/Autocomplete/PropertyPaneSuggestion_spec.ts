import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper,
  CommonLocators,
  EntityExplorer,
  PropertyPane,
} = ObjectsRegistry;

describe("Property Pane Suggestions", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should show Property Pane Suggestions on / command", () => {
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
  });

  it("2. Should show Property Pane Suggestions on typing {{}}", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{");
    AggregateHelper.GetNAssertElementText(CommonLocators._hints, "appsmith");
    AggregateHelper.GetNClickByContains(CommonLocators._hints, "appsmith");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
