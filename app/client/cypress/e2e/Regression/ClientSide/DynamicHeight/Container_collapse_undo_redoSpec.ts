import {
  entityExplorer,
  locators,
  agHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    agHelper.AddDsl("DynamicHeightDefaultHeightdsl");

    entityExplorer.SelectEntityByName("Container1");
    agHelper
      .GetWidgetCSSHeight(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
      )
      .then((initialContainerHeight: number) => {
        // Select the Text Widget and capture its initial height
        entityExplorer.SelectEntityByName("Button1", "Container1");
        agHelper.PressDelete();
        agHelper.WaitUntilAllToastsDisappear();
        agHelper
          .GetWidgetCSSHeight(
            locators._widgetInDeployed(draggableWidgets.CONTAINER),
          )
          .then((updatedContainerHeight: number) => {
            expect(initialContainerHeight).to.not.equal(updatedContainerHeight);
            expect(updatedContainerHeight).to.equal("100px");
            agHelper.TypeText(locators._body, `{${modifierKey}}z`, 0, true);
            agHelper.Sleep(2000);
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed(draggableWidgets.CONTAINER),
              )
              .then((CurrentContainerHeight: number) => {
                expect(CurrentContainerHeight).to.equal(initialContainerHeight);
              });
          });
      });
  });
});
