import {
  agHelper,
  entityExplorer,
  propPane,
  autoLayout,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Validating use cases for Auto Dimension",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
    });

    beforeEach(() => {
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
      agHelper.SetCanvasViewportWidth(808);
    });

    ["DESKTOP", "MOBILE"].forEach((viewport) => {
      it(`1. [${viewport}] Check if widget's auto height updation updates container's height`, () => {
        if (viewport === "MOBILE") {
          agHelper.SetCanvasViewportWidth(375);
        }
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.CONTAINER);
        entityExplorer.DragDropWidgetNVerify(
          "textwidget",
          50,
          20,
          draggableWidgets.CONTAINER,
        );

        // Add multi-line text & verify if the container's height increases

        agHelper.GetHeight(autoLayout._containerWidgetSelector);
        cy.get("@eleHeight").then(($initialHeight) => {
          propPane.UpdatePropertyFieldValue(
            "Text",
            "hello\nWorld\nThis\nis\na\nMulti-line\nTexthello\nWorld\nThis\nis\na\nMulti-line\nText",
          );
          agHelper.GetHeight(autoLayout._containerWidgetSelector);
          cy.get("@eleHeight").then(($longTextheight: any) => {
            expect($longTextheight).to.be.greaterThan(Number($initialHeight));

            // Remove some lines & verify if the container's height decreases
            propPane.UpdatePropertyFieldValue("Text", "hello");
            agHelper.GetHeight(autoLayout._containerWidgetSelector);
            cy.get("@eleHeight").then((height: any) => {
              expect(height).to.be.lessThan(Number($longTextheight));
            });
          });
        });
      });

      it("2. Check if widget's bounding box fits on widget shrink", () => {
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 100, 30);
        propPane.UpdatePropertyFieldValue(
          "Text",
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        );
        // Check if bounding box fits perfectly to the Text Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._textWidgetSelector,
          autoLayout._textComponentSelector,
        );

        // Drop another widget next to text widget so that it shrinks
        entityExplorer.DragDropWidgetNVerify(
          draggableWidgets.CONTAINER,
          10,
          30,
        );

        // Check if bounding box fits perfectly to the Text Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._textWidgetSelector,
          autoLayout._textComponentSelector,
        );
      });

      it("3. Check if widgets bounding box fits on canvas resizing", () => {
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 100, 30);
        propPane.UpdatePropertyFieldValue(
          "Text",
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        );
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 200);

        // reduce canvas size
        agHelper.SetCanvasViewportWidth(500);

        // Check if bounding box fits perfectly to the Text Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._textWidgetSelector,
          autoLayout._textComponentSelector,
        );

        // Check if bounding box fits perfectly to the Button Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._buttonWidgetSelector,
          autoLayout._buttonComponentSelector,
        );

        // increase canvas size
        agHelper.SetCanvasViewportWidth(700);

        // Check if bounding box fits perfectly to the Text Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._textWidgetSelector,
          autoLayout._textComponentSelector,
        );

        // Check if bounding box fits perfectly to the Button Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._buttonWidgetSelector,
          autoLayout._buttonComponentSelector,
        );

        // reduce canvas size less than mobile breakpoint
        agHelper.SetCanvasViewportWidth(300);

        // Check if bounding box fits perfectly to the Text Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._textWidgetSelector,
          autoLayout._textComponentSelector,
        );

        // Check if bounding box fits perfectly to the Button Widget
        autoLayout.EnsureBoundingBoxFitsComponent(
          autoLayout._buttonWidgetSelector,
          autoLayout._buttonComponentSelector,
        );
      });
    });
  },
);
