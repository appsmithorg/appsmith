import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { WIDGET } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/canvas/utils";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import * as viewWidgets from "../../../../locators/ViewWidgets.json";

describe(`${ANVIL_EDITOR_TEST}: Anvil tests for DnD Module`, () => {
  it("1. Drag and Drop widget onto Empty Canvas", () => {
    const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
    agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
      const x = mainCanvas.position().left;
      const y = mainCanvas.position().top;
      const width = mainCanvas.width() || 0;
      // start align
      entityExplorer.DragDropWidgetNVerify(WIDGET.WDSBUTTON, x, y + 20, {
        skipWidgetSearch: true,
      });
      // center align
      entityExplorer.DragDropWidgetNVerify(
        WIDGET.WDSBUTTON,
        x + width / 2,
        y + 20,
        {
          skipWidgetSearch: true,
        },
      );
      // end align
      entityExplorer.DragDropWidgetNVerify(
        WIDGET.WDSBUTTON,
        x + width - 20,
        y + 20,
        {
          skipWidgetSearch: true,
        },
      );
      agHelper.AssertElementLength(viewWidgets.wdsButtonWidget, 3);
    });
  });
});
