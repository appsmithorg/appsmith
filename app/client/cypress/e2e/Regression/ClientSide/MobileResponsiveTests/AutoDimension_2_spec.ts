import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    _.propPane.ConvertToAutoLayout();
  });

  beforeEach(() => {
    // Cleanup the canvas before each test
    _.agHelper.SelectAllWidgets();
    _.agHelper.PressDelete();
    _.agHelper.SetCanvasViewportWidth(808);
  });

  ["DESKTOP", "MOBILE"].forEach((viewport) => {
    it(`1. [${viewport}] Check if widget's auto height updation updates container's height`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.CONTAINER,
        100,
        30,
      );
      _.widgets
        .GetWidgetByName("Container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          _.entityExplorer.DragDropWidgetNVerify(
            "textwidget",
            50,
            20,
            dropTargetClass,
          );

          // Add multi-line text & verify if the container's height increases
          _.widgets
            .GetWidgetHeight(_.widgets._containerWidgetSelector)
            .as("initialHeight");
          _.propPane.UpdatePropertyFieldValue(
            "Text",
            "hello\nWorld\nThis\nis\na\nMulti-line\nText",
          );
          _.widgets
            .GetWidgetHeight(_.widgets._containerWidgetSelector)
            .then((width) => {
              cy.get<number>("@initialHeight").then((initialHeight) => {
                expect(width).to.be.greaterThan(initialHeight);
              });
            });

          // Remove some lines & verify if the container's height decreases
          _.propPane.UpdatePropertyFieldValue("Text", "hello");
          _.widgets
            .GetWidgetHeight(_.widgets._containerWidgetSelector)
            .then((width) => {
              cy.get<number>("@initialHeight").then((initialHeight) => {
                expect(width).to.be.equal(initialHeight);
              });
            });
        });
    });
  });

  it("2. Check if widget's bounding box fits on widget shrink", () => {
    _.entityExplorer.DragDropWidgetNVerify("textwidget", 100, 30);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._textWidgetSelector,
      _.widgets._textComponentSelector,
    );

    // Drop another widget next to text widget so that it shrinks
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.CONTAINER,
      10,
      30,
    );

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._textWidgetSelector,
      _.widgets._textComponentSelector,
    );
  });

  it("3. Check if widgets bounding box fits on canvas resizing", () => {
    _.entityExplorer.DragDropWidgetNVerify("textwidget", 100, 30);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 100, 200);

    // reduce canvas size
    _.agHelper.SetCanvasViewportWidth(500);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._textWidgetSelector,
      _.widgets._textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._buttonWidgetSelector,
      _.widgets._buttonComponentSelector,
    );

    // increase canvas size
    _.agHelper.SetCanvasViewportWidth(700);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._textWidgetSelector,
      _.widgets._textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._buttonWidgetSelector,
      _.widgets._buttonComponentSelector,
    );

    // reduce canvas size less than mobile breakpoint
    _.agHelper.SetCanvasViewportWidth(300);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._textWidgetSelector,
      _.widgets._textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      _.widgets._buttonWidgetSelector,
      _.widgets._buttonComponentSelector,
    );
  });
});
