import {
  getWidgetSelector,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;
const propPane = ObjectsRegistry.PropertyPane;
const locator = ObjectsRegistry.CommonLocators;

describe("List widget v1 spec", () => {
  before(() => {
    /**
     * On the canvas we have a List Widget
     */
    cy.fixture("listWidgetDsl").then((dsl: string) => {
      agHelper.AddDsl(dsl);
    });
  });

  it("1. Validate if the 'items' property is present in the property pane", () => {
    ee.SelectEntityByName("List1", "Widgets");
    agHelper.AssertElementVisible(locator._listWidgetItemsDatalabel);
  });
  it("2. Validate if the 'server-side pagination' property is present in the property pane", () => {
    // ee.SelectEntityByName("List1", "Widgets");
    agHelper.AssertElementVisible(locator._listWidgetPaginationlabel);
  });
  it("3. Validate if the 'Visible' property is present in the property pane", () => {
    agHelper.AssertElementVisible(locator._listWidgetVisiblelabel);
  });
  it("4. Validate if the 'Animate Loading' property is present in the property pane", () => {
    agHelper.AssertElementVisible(locator._listWidgetAnimateLoadinglabel);
  });
  it("4. Validate if the 'OnListItemClick' property is present in the property pane", () => {
    agHelper.AssertElementVisible(locator._listWidgetClickEventlabel);
  });
});
