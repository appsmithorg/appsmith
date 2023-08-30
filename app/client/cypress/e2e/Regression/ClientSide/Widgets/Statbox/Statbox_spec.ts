import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  appSettings,
  assertHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Statbox spec", () => {
  before(() => {
    /**
     * On the canvas we have a Statbox Widget
     */
    cy.fixture("StatboxDsl").then((dsl: string) => {
      agHelper.AddDsl(dsl);
    });
  });

  it("1. Validate if the Visible, Animate Loading and Height properties are present in the property pane", () => {
    entityExplorer.SelectEntityByName("Statbox1", "Widgets");
    //agHelper.GetNClick(appSettings.locators)
    agHelper.AssertContains("Visible", "exist", "label");
    agHelper.AssertContains("Animate Loading", "exist", "label");
    agHelper.AssertContains("Height", "exist", "label");
    // Switch to the Style Tab
    propPane.MoveToTab("Style");
  });
});
