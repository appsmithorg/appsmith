import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, EntityExplorer, PropertyPane } = ObjectsRegistry;

describe("Property Pane Code Commenting", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should comment code in Property Pane", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{appsmith}}");
    PropertyPane.ToggleCommentInTextField("Label");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{// appsmith}}");
  });

  it("2. Should uncomment code in Property Pane", () => {
    EntityExplorer.SelectEntityByName("Button1", "Widgets");
    PropertyPane.TypeTextIntoField("Label", "{{// appsmith}}");
    PropertyPane.ToggleCommentInTextField("Label");

    PropertyPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});
