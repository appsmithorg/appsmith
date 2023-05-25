import * as _ from "../../../../support/Objects/ObjectsCore";

const buttonWidgetSelector = ".t--widget-buttonwidget";
const buttonComponentSelector = ".t--widget-buttonwidget button";
const textWidgetSelector = ".t--widget-textwidget";
const textComponentSelector = ".t--widget-textwidget .t--text-widget-container";
const containerWidgetSelector = ".t--widget-containerwidget";

function dropButtonAndTest(x: number, y: number, dropTarget = "") {
  _.entityExplorer.DragDropWidgetNVerify("buttonwidget", x, y, dropTarget);

  // Check if bounding box fits perfectly to the Button Widget
  _.widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );

  // Increase the length of button label & verify if the component expands
  _.widgets.GetWidgetWidth(buttonWidgetSelector).as("initialWidth");
  _.propPane.UpdatePropertyFieldValue("Label", "Lengthy Button Label");
  _.widgets.GetWidgetWidth(buttonWidgetSelector).then((width: number) => {
    cy.get<number>("@initialWidth").then((initialWidth) => {
      expect(width).to.be.greaterThan(initialWidth);
    });
  });

  // verify if the bounding box fits perfectly to the Button Widget after expanding
  _.widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );

  // Decrease the length of button label & verify if the component shrinks
  _.widgets.GetWidgetWidth(buttonWidgetSelector).as("initialWidth");
  _.propPane.UpdatePropertyFieldValue("Label", "Label");
  _.widgets.GetWidgetWidth(buttonWidgetSelector).then((width: number) => {
    cy.get<number>("@initialWidth").then((initialWidth) => {
      expect(width).to.be.lessThan(initialWidth);
    });
  });

  // verify if the bounding box fits perfectly to the Button Widget after expanding
  _.widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );
}

function dropTextAndTest(x: number, y: number, dropTarget = "") {
  _.entityExplorer.DragDropWidgetNVerify("textwidget", x, y, dropTarget);

  // Check if bounding box fits perfectly to the Text Widget
  _.widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );

  // Add multi-line text & verify if the component's height increases
  _.widgets.GetWidgetHeight(textWidgetSelector).as("initialHeight");
  _.propPane.UpdatePropertyFieldValue(
    "Text",
    "hello\nWorld\nThis\nis\na\nMulti-line\nText",
  );
  _.widgets.GetWidgetHeight(textWidgetSelector).then((width: number) => {
    cy.get<number>("@initialHeight").then((initialHeight) => {
      expect(width).to.be.greaterThan(initialHeight);
    });
  });

  // Check if bounding box fits perfectly to the Text Widget
  _.widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );

  // Remove some lines & verify if the component's height decreases
  _.widgets.GetWidgetHeight(textWidgetSelector).as("initialHeight");
  _.propPane.UpdatePropertyFieldValue("Text", "hello\nWorld\nblabla");
  _.widgets.GetWidgetHeight(textWidgetSelector).then((width: number) => {
    cy.get<number>("@initialHeight").then((initialWidth) => {
      expect(width).to.be.lessThan(initialWidth);
    });
  });

  // Check if bounding box fits perfectly to the Text Widget
  _.widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );
}

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
    it(`1. [${viewport}] Verify if Auto dimension works for widgets in the MainCanvas`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      dropButtonAndTest(100, 30);
      dropTextAndTest(100, 60);
    });

    it(`2. [${viewport}] Verify if Auto dimension works for widgets in a Container`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify("containerwidget", 100, 30);

      cy.get(".t--widget-container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          dropButtonAndTest(100, 25, dropTargetClass);
          // y = main canvas padding (8) + button widget height (40)
          dropTextAndTest(100, 48, dropTargetClass);
        });
    });

    it(`3. [${viewport}] Verify if Auto dimension works for widgets in a List`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify("listwidgetv2", 100, 30);

      // Delete existing widgets within list
      _.agHelper.SelectAllWidgets(".t--widget-container1");
      _.agHelper.PressDelete();

      cy.get(".t--widget-container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          dropButtonAndTest(100, 25, dropTargetClass);
          // y = main canvas padding (8) + button widget height (40)
          dropTextAndTest(100, 48, dropTargetClass);
        });
    });

    it(`4. [${viewport}] Check if widget's auto height updation updates container's height`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify("containerwidget", 100, 30);
      cy.get(".t--widget-container1")
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
            .GetWidgetHeight(containerWidgetSelector)
            .as("initialHeight");
          _.propPane.UpdatePropertyFieldValue(
            "Text",
            "hello\nWorld\nThis\nis\na\nMulti-line\nText",
          );
          _.widgets
            .GetWidgetHeight(containerWidgetSelector)
            .then((width: number) => {
              cy.get<number>("@initialHeight").then((initialHeight) => {
                expect(width).to.be.greaterThan(initialHeight);
              });
            });

          // Remove some lines & verify if the container's height decreases
          _.propPane.UpdatePropertyFieldValue("Text", "hello");
          _.widgets
            .GetWidgetHeight(containerWidgetSelector)
            .then((width: number) => {
              cy.get<number>("@initialHeight").then((initialHeight) => {
                expect(width).to.be.equal(initialHeight);
              });
            });
        });
    });
  });

  it("5. Check if widget's bounding box fits on widget shrink", () => {
    _.entityExplorer.DragDropWidgetNVerify("textwidget", 100, 30);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Drop another widget next to text widget so that it shrinks
    _.entityExplorer.DragDropWidgetNVerify("containerwidget", 10, 30);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );
  });

  it("6. Check if widgets bounding box fits on canvas resizing", () => {
    _.entityExplorer.DragDropWidgetNVerify("textwidget", 100, 30);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);

    // reduce canvas size
    _.agHelper.SetCanvasViewportWidth(500);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );

    // increase canvas size
    _.agHelper.SetCanvasViewportWidth(700);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );

    // reduce canvas size less than mobile breakpoint
    _.agHelper.SetCanvasViewportWidth(300);

    // Check if bounding box fits perfectly to the Text Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    _.widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );
  });
});
