import {
  agHelper,
  assertHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation with multiple containers and text widget",
  { tags: ["@tag.AutoHeight"] },
  function () {
    it("1. Validate change with auto height width for widgets", function () {
      let textMsg =
        "Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height";
      agHelper.AddDsl("dynamicHeightCanvasResizeDsl");

      // Select the Outer container and capture initial height
      EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
        )
        .then((initialContainerHeight: number) => {
          // Select the Text Widget and capture its initial height
          EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
            "Container1",
          ]);
          agHelper.Sleep(1000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TEXT),
            )
            .then((initialTextWidgetHeight: number) => {
              // Change the text label based on the textMsg above
              propPane.UpdatePropertyFieldValue("Text", textMsg);
              propPane.MoveToTab("Style");
              assertHelper.AssertNetworkStatus("@updateLayout", 200);
              // Select the Text Widget and capture its updated height post change of text label
              EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.TEXT),
                )
                .then((updatedTextWidgetHeight: number) => {
                  // Asserts the change in height from initial height of text widget wrt updated height
                  expect(initialTextWidgetHeight).to.not.equal(
                    updatedTextWidgetHeight,
                  );
                  // Select the outer Container Widget and capture its updated height post change of text label
                  EditorNavigation.SelectEntityByName(
                    "Container1",
                    EntityType.Widget,
                  );
                  agHelper
                    .GetWidgetCSSHeight(
                      locators._widgetInDeployed(draggableWidgets.CONTAINER),
                    )
                    .then((updatedContainerHeight: number) => {
                      // Asserts the change in height from initial height of container widget wrt updated height
                      expect(initialContainerHeight).to.not.equal(
                        updatedContainerHeight,
                      );
                      EditorNavigation.SelectEntityByName(
                        "Text1",
                        EntityType.Widget,
                      );
                      propPane.MoveToTab("Content");
                      // Clear Text Label
                      propPane.RemoveText("Text");
                      assertHelper.AssertNetworkStatus("@updateLayout", 200);
                      EditorNavigation.SelectEntityByName(
                        "Container1",
                        EntityType.Widget,
                      );
                      agHelper
                        .GetWidgetCSSHeight(
                          locators._widgetInDeployed(
                            draggableWidgets.CONTAINER,
                          ),
                        )
                        .then((revertedContainerHeight: number) => {
                          // Asserts the change in height from updated height of container widget wrt current height
                          // As the text label is cleared the reverted height should be equal to initial height
                          expect(initialContainerHeight).to.equal(
                            revertedContainerHeight,
                          );
                        });
                    });
                });
            });
        });
    });
  },
);
