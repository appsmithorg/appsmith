import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { WIDGET } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  anvilLayout,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/canvas/utils";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(`${ANVIL_EDITOR_TEST}: Anvil tests for Widget Name Canvas`, () => {
  beforeEach(() => {
    // intercept features call for Anvil + WDS tests
    featureFlagIntercept({ release_anvil_enabled: true, ab_wds_enabled: true });
    // Cleanup the canvas before each test
    agHelper.SelectAllWidgets(`#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`);
    agHelper.PressDelete();
  });
  it("1. Widget Name should not be cut off at the top", () => {
    const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
    agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
      const x = mainCanvas.position().left;
      const y = mainCanvas.position().top;
      const width = mainCanvas.width() || 0;
      // start align
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSBUTTON, x + 10, y + 20, {
        skipWidgetSearch: true,
      });
      // end align
      anvilLayout.DragDropAnvilWidgetNVerify(
        WIDGET.WDSBUTTON,
        x + width - 20,
        y + 20,
        {
          skipWidgetSearch: true,
        },
      );
      agHelper
        .AssertAttribute(
          locators._widgetInCanvas(WIDGET.WDSBUTTON),
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
            cy.get("#widget-name-canvas").trigger(
              "mouseover",
              x + width - 10 - leftOffset,
              y + 50 - topOffset,
              { force: true },
            );
            // for new screen shot
            // cy.get("#widget-name-canvas").screenshot();
            cy.get("#widget-name-canvas").matchImageSnapshot(
              "WidgetNameShouldNotBeCutOff",
            );
          });
        });
    });
  });
});
