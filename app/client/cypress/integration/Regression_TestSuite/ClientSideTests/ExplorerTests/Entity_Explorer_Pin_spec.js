const dsl = require("../../../../fixtures/displayWidgetDsl.json");
import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  canvasHelper = ObjectsRegistry.CanvasHelper,
  appSettings = ObjectsRegistry.AppSettings;

describe("Entity explorer tests related to pinning and unpinning", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks entity explorer visibility on unpin", function() {
    cy.wait(5000);
    cy.get(".t--entity-explorer").should("be.visible");
    cy.get(".t--pin-entity-explorer").click();
    cy.wait(5000);
    cy.get("[data-testid=widgets-editor]").click({ force: true });
    cy.wait(3000);
    cy.get(".t--entity-explorer").should("not.be.visible");
  });

  it("checks entity explorer visibility on pin", function() {
    cy.get(".t--pin-entity-explorer").click();
    cy.get(".t--entity-explorer").should("be.visible");
  });

  it("Widgets visibility in widget pane", function() {
    canvasHelper.OpenWidgetPane();
    agHelper.ScrollTo(locator._widgetPane, "bottom");
    agHelper.AssertElementVisible(ee.locator._widgetPageIcon(WIDGET.VIDEO));
    ee.PinUnpinEntityExplorer(true);
    appSettings.OpenAppSettings();
    canvasHelper.OpenWidgetPane();
    agHelper.ScrollTo(locator._widgetPane, "bottom");
    agHelper.AssertElementVisible(ee.locator._widgetPageIcon(WIDGET.VIDEO));
    ee.PinUnpinEntityExplorer(false);
  });
});
