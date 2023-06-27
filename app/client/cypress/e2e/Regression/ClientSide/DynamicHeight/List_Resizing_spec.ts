import {
  entityExplorer,
  locators,
  agHelper,
  deployMode,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for List widgets", function () {
    cy.fixture("ResizeListDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Tab 1", "Tabs1");
    entityExplorer.SelectEntityByName("List1", "Tab 1");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("listwidgetv2"))
      .then((currentListHeight: number) => {
        propPane.MoveToTab("Style");
        propPane.TypeTextIntoField("itemspacing\\(px\\)", "16", true);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("listwidgetv2"))
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
            agHelper.GetNAssertContains(".rc-pagination", "5");
          });
      });
  });
});
