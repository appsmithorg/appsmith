import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { WIDGET } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/canvas/utils";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import * as viewWidgets from "../../../../locators/ViewWidgets.json";

describe(`${ANVIL_EDITOR_TEST}: Anvil tests for Widget Name Canvas`, () => {
  it("1. Drag and Drop widget using widget name", () => {
    const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
    agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
      const x = mainCanvas.position().left;
      const y = mainCanvas.position().top;
      const width = mainCanvas.width() || 0;
      // start align
      entityExplorer.DragDropWidgetNVerify(WIDGET.WDSBUTTON, x, y + 20, {
        skipWidgetSearch: true,
      });
      // end align
      entityExplorer.DragDropWidgetNVerify(
        WIDGET.WDSBUTTON,
        x + width - 20,
        y + 20,
        {
          skipWidgetSearch: true,
        },
      );
      agHelper
        .AssertAttribute(
          viewWidgets.wdsButtonWidget,
          "data-testid",
          "t--selected",
          1,
        )
        .trigger("mouseover")
        .then(async (buttonWidget) => {
          const x = buttonWidget[0].getBoundingClientRect().left;
          const y = buttonWidget[0].getBoundingClientRect().top;
          const width = buttonWidget.width() || 0;
          cy.get("#widget-name-canvas").then((widgetNameCanvas) => {
            const topOffset = widgetNameCanvas[0].getBoundingClientRect().top;
            const leftOffset = widgetNameCanvas[0].getBoundingClientRect().left;
            cy.get("#widget-name-canvas")
              .trigger(
                "mouseover",
                x + width - 10 - leftOffset,
                y + 50 - topOffset,
                { force: true },
              )
              .trigger(
                "dragstart",
                x + width - 10 - leftOffset,
                y + 50 - topOffset,
                { force: true },
              )
              .trigger(
                "mousemove",
                x + width - 10 - leftOffset,
                y + 50 - topOffset,
                { force: true },
              );
          });
        });
    });
  });
});
