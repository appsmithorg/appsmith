import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  widgets = ObjectsRegistry.Widgets;

const buttonWidgetSelector = ".t--widget-buttonwidget";
const buttonComponentSelector = ".t--widget-buttonwidget button";
const textWidgetSelector = ".t--widget-textwidget";
const textComponentSelector = ".t--widget-textwidget .t--text-widget-container";
const containerWidgetSelector = ".t--widget-containerwidget";

function dropButtonAndTest(x: number, y: number, dropTarget = "") {
  ee.DragDropWidgetNVerify("buttonwidget", x, y, dropTarget);

  // Check if bounding box fits perfectly to the Button Widget
  widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );

  // Increase the length of button label & verify if the component expands
  widgets.GetWidgetWidth(buttonWidgetSelector).as("initialWidth");
  propPane.UpdatePropertyFieldValue("Label", "Lengthy Button Label");
  widgets.GetWidgetWidth(buttonWidgetSelector).then((width) => {
    cy.get<number>("@initialWidth").then((initialWidth) => {
      expect(width).to.be.greaterThan(initialWidth);
    });
  });

  // verify if the bounding box fits perfectly to the Button Widget after expanding
  widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );

  // Decrease the length of button label & verify if the component shrinks
  widgets.GetWidgetWidth(buttonWidgetSelector).as("initialWidth");
  propPane.UpdatePropertyFieldValue("Label", "Label");
  widgets.GetWidgetWidth(buttonWidgetSelector).then((width) => {
    cy.get<number>("@initialWidth").then((initialWidth) => {
      expect(width).to.be.lessThan(initialWidth);
    });
  });

  // verify if the bounding box fits perfectly to the Button Widget after expanding
  widgets.EnsureBoundingBoxFitsComponent(
    buttonWidgetSelector,
    buttonComponentSelector,
  );
}

function dropTextAndTest(x: number, y: number, dropTarget = "") {
  ee.DragDropWidgetNVerify("textwidget", x, y, dropTarget);

  // Check if bounding box fits perfectly to the Text Widget
  widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );

  // Add multi-line text & verify if the component's height increases
  widgets.GetWidgetHeight(textWidgetSelector).as("initialHeight");
  propPane.UpdatePropertyFieldValue(
    "Text",
    "hello\nWorld\nThis\nis\na\nMulti-line\nText",
  );
  widgets.GetWidgetHeight(textWidgetSelector).then((width) => {
    cy.get<number>("@initialHeight").then((initialHeight) => {
      expect(width).to.be.greaterThan(initialHeight);
    });
  });

  // Check if bounding box fits perfectly to the Text Widget
  widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );

  // Remove some lines & verify if the component's height decreases
  widgets.GetWidgetHeight(textWidgetSelector).as("initialHeight");
  propPane.UpdatePropertyFieldValue("Text", "hello\nWorld\nblabla");
  widgets.GetWidgetHeight(textWidgetSelector).then((width) => {
    cy.get<number>("@initialHeight").then((initialWidth) => {
      expect(width).to.be.lessThan(initialWidth);
    });
  });

  // Check if bounding box fits perfectly to the Text Widget
  widgets.EnsureBoundingBoxFitsComponent(
    textWidgetSelector,
    textComponentSelector,
  );
}

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    propPane.ConvertToAutoLayout();
  });

  beforeEach(() => {
    // Cleanup the canvas before each test
    agHelper.SelectAllWidgets();
    agHelper.PressDelete();
    agHelper.SetCanvasViewportWidth(808);
  });

  ["DESKTOP", "MOBILE"].forEach((viewport) => {
    it(`1. [${viewport}] Verify if Auto dimension works for widgets in the MainCanvas`, () => {
      if (viewport === "MOBILE") {
        agHelper.SetCanvasViewportWidth(375);
      }
      dropButtonAndTest(100, 30);
      dropTextAndTest(100, 60);
    });

    it(`2. [${viewport}] Verify if Auto dimension works for widgets in a Container`, () => {
      if (viewport === "MOBILE") {
        agHelper.SetCanvasViewportWidth(375);
      }
      ee.DragDropWidgetNVerify("containerwidget", 100, 30);

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
        agHelper.SetCanvasViewportWidth(375);
      }
      ee.DragDropWidgetNVerify("listwidgetv2", 100, 30);

      // Delete existing widgets within list
      agHelper.SelectAllWidgets(".t--widget-container1");
      agHelper.PressDelete();

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
        agHelper.SetCanvasViewportWidth(375);
      }
      ee.DragDropWidgetNVerify("containerwidget", 100, 30);
      cy.get(".t--widget-container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          ee.DragDropWidgetNVerify("textwidget", 100, 25, dropTargetClass);

          // Add multi-line text & verify if the container's height increases
          widgets.GetWidgetHeight(containerWidgetSelector).as("initialHeight");
          propPane.UpdatePropertyFieldValue(
            "Text",
            "hello\nWorld\nThis\nis\na\nMulti-line\nText",
          );
          widgets.GetWidgetHeight(containerWidgetSelector).then((width) => {
            cy.get<number>("@initialHeight").then((initialHeight) => {
              expect(width).to.be.greaterThan(initialHeight);
            });
          });

          // Remove some lines & verify if the container's height decreases
          propPane.UpdatePropertyFieldValue("Text", "hello");
          widgets.GetWidgetHeight(containerWidgetSelector).then((width) => {
            cy.get<number>("@initialHeight").then((initialHeight) => {
              expect(width).to.be.equal(initialHeight);
            });
          });
        });
    });
  });

  it("5. Check if widget's bounding box fits on widget shrink", () => {
    ee.DragDropWidgetNVerify("textwidget", 100, 30);
    propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    // Check if bounding box fits perfectly to the Text Widget
    widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Drop another widget next to text widget so that it shrinks
    ee.DragDropWidgetNVerify("containerwidget", 10, 30);

    // Check if bounding box fits perfectly to the Text Widget
    widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );
  });

  it("6. Check if widgets bounding box fits on canvas resizing", () => {
    ee.DragDropWidgetNVerify("textwidget", 100, 30);
    propPane.UpdatePropertyFieldValue(
      "Text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );
    ee.DragDropWidgetNVerify("buttonwidget", 100, 200);

    // reduce canvas size
    agHelper.SetCanvasViewportWidth(500);

    // Check if bounding box fits perfectly to the Text Widget
    widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );

    // increase canvas size
    agHelper.SetCanvasViewportWidth(700);

    // Check if bounding box fits perfectly to the Text Widget
    widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );

    // reduce canvas size less than mobile breakpoint
    agHelper.SetCanvasViewportWidth(300);

    // Check if bounding box fits perfectly to the Text Widget
    widgets.EnsureBoundingBoxFitsComponent(
      textWidgetSelector,
      textComponentSelector,
    );

    // Check if bounding box fits perfectly to the Button Widget
    widgets.EnsureBoundingBoxFitsComponent(
      buttonWidgetSelector,
      buttonComponentSelector,
    );
  });
});
