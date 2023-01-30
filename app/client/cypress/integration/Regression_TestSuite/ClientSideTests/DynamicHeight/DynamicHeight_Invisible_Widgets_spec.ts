import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators } = ObjectsRegistry;

describe("Property Pane Code Commenting", () => {
  before(() => {
    cy.fixture("autoHeightInvisibleWidgetsDSL").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Divider should be below Button Widget in edit mode", () => {
    cy.get(CommonLocators._buttonWidget).should("have.css", "height", "230px");
    cy.get(CommonLocators._filepickerWidget).should(
      "have.css",
      "height",
      "90px",
    );

    cy.get(CommonLocators._dividerWidget).should("have.css", "top", "246px");
    cy.get(CommonLocators._checkboxWidget).should("have.css", "top", "96px");
  });

  it("2. Divider should move up by the height of the button widget in view mode", () => {
    AggregateHelper.AssertElementVisible(
      CommonLocators._previewModeToggle("edit"),
    );
    AggregateHelper.GetNClick(CommonLocators._previewModeToggle("edit"));

    cy.get(CommonLocators._dividerWidget).should("have.css", "top", "16px");
    cy.get(CommonLocators._checkboxWidget).should("have.css", "top", "6px");
  });
});
