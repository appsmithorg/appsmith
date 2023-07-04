import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators, DeployMode } = ObjectsRegistry;

describe("Fixed Invisible widgets and auto height containers", () => {
  before(() => {
    // Create a page with a divider below a button widget and a checkbox widget below a filepicker widget
    // Button widget and filepicker widgets are fixed height widgets
    cy.fixture("autoHeightOverlapDSL").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Invisible widgets should not overlap when returning from preview mode to edit mode", () => {
    cy.get(CommonLocators._widgetInDeployed("textwidget"));
    AggregateHelper.AssertContains("anything", "exist", "#ryq5qy60cg");

    AggregateHelper.AssertElementVisible(
      CommonLocators._previewModeToggle("edit"),
    );
    AggregateHelper.GetNClick(CommonLocators._previewModeToggle("edit"));

    AggregateHelper.AssertElementVisible(
      CommonLocators._previewModeToggle("preview"),
    );
    AggregateHelper.GetNClick(CommonLocators._previewModeToggle("preview"));

    cy.get("#ryq5qy60cg").should("have.css", "top", "136px");
    cy.get("#kx7mvoopqu").should("have.css", "top", "96px");
    cy.get("#m4doxmviiu").should("have.css", "top", "56px");
  });
});
