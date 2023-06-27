import {
  entityExplorer,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.fixture("DynamicHeightDefaultHeightdsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Container1");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
      .then((initialContainerHeight: number) => {
        // Select the Text Widget and capture its initial height
        entityExplorer.SelectEntityByName("Button1", "Container1");
        agHelper.Sleep(1000);
        agHelper.PressDelete();
        agHelper.Sleep(2000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
          .then((updatedContainerHeight: number) => {
            expect(initialContainerHeight).to.not.equal(updatedContainerHeight);
            expect(updatedContainerHeight).to.equal("100px");
            agHelper.GetElement("body").type(`{${modifierKey}}z`);
            agHelper.Sleep(2000);
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
              .then((CurrentContainerHeight: number) => {
                expect(CurrentContainerHeight).to.equal(initialContainerHeight);
              });
          });
      });
  });
});
