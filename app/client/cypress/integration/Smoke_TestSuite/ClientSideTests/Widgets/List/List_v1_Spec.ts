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

  it("1. Validate if the 'items', 'server-side pagination', 'Visible', 'Animate Loading' and 'OnListItemClick' properties are present in the property pane", () => {
    ee.SelectEntityByName("List1", "Widgets");
    agHelper.AssertElementVisible(locator._listWidgetItemsDatalabel);
    agHelper.AssertElementVisible(locator._listWidgetPaginationlabel);
    agHelper.AssertElementVisible(locator._listWidgetVisiblelabel);
    agHelper.AssertElementVisible(locator._listWidgetAnimateLoadinglabel);
    agHelper.AssertElementVisible(locator._listWidgetClickEventlabel);
  });
});
