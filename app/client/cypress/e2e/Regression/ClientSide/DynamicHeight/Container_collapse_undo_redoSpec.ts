import {
  agHelper,
  assertHelper,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    agHelper.AddDsl("DynamicHeightDefaultHeightdsl");

    EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
    agHelper
      .GetWidgetCSSHeight(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
      )
      .then((initialContainerHeight: number) => {
        // Select the Text Widget and capture its initial height
        EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
          "Container1",
        ]);
        agHelper.PressDelete();
        agHelper.WaitUntilAllToastsDisappear();
        assertHelper.AssertNetworkStatus("updateLayout");
        agHelper.Sleep(2000);
        agHelper
          .GetWidgetCSSHeight(
            locators._widgetInDeployed(draggableWidgets.CONTAINER),
          )
          .then((updatedContainerHeight: number) => {
            expect(initialContainerHeight).to.not.equal(updatedContainerHeight);
            expect(updatedContainerHeight).to.equal("100px");
            agHelper.TypeText(locators._body, `{${modifierKey}}z`, {
              parseSpecialCharSeq: true,
            });
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
