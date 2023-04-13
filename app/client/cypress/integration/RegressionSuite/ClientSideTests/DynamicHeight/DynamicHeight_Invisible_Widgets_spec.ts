import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators, DeployMode } = ObjectsRegistry;

describe("Fixed Invisible widgets and auto height containers", () => {
  before(() => {
    // Create a page with a divider below a button widget and a checkbox widget below a filepicker widget
    // Button widget and filepicker widgets are fixed height widgets
    cy.fixture("autoHeightInvisibleWidgetsDSL").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Divider should be below Button Widget in edit mode", () => {
    // This test checks for the height of the button widget and the filepicker widget
    // As well as the top value for the widgets below button and filepicker (divider and checkbox respectively)
    cy.get(CommonLocators._widgetInDeployed("buttonwidget")).should(
      "have.css",
      "height",
      "230px",
    );
    cy.get(CommonLocators._widgetInDeployed("filepickerwidgetv2")).should(
      "have.css",
      "height",
      "90px",
    );

    cy.get(CommonLocators._widgetInDeployed("dividerwidget")).should(
      "have.css",
      "top",
      "246px",
    );
    cy.get(CommonLocators._widgetInDeployed("checkboxwidget")).should(
      "have.css",
      "top",
      "96px",
    );
  });

  it("2. Divider should move up by the height of the button widget in preview mode", () => {
    // This tests if the divider and checkbox widget move up by an appropriate amount in preview mode.
    AggregateHelper.AssertElementVisible(
      CommonLocators._previewModeToggle("edit"),
    );
    AggregateHelper.GetNClick(CommonLocators._previewModeToggle("edit"));

    cy.get(CommonLocators._widgetInDeployed("dividerwidget")).should(
      "have.css",
      "top",
      "16px",
    );
    cy.get(CommonLocators._widgetInDeployed("checkboxwidget")).should(
      "have.css",
      "top",
      "6px",
    );
  });

  it("3. Divider should move up by the height of the button widget in view mode", () => {
    // This tests if the divider and checkbox widget move up by an appropriate amount in view mode.
    DeployMode.DeployApp();
    cy.get(CommonLocators._widgetInDeployed("dividerwidget")).should(
      "have.css",
      "top",
      "16px",
    );
    cy.get(CommonLocators._widgetInDeployed("checkboxwidget")).should(
      "have.css",
      "top",
      "6px",
    );
  });
});
