import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { WIDGET } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  anvilLayout,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/viewer/canvas/utils";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for DnD Module`,
  { tags: ["@tag.Anvil"] },
  () => {
    beforeEach(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Drag and Drop widget onto Empty Canvas", () => {
      const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
      agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
        const x = mainCanvas.position().left;
        const y = mainCanvas.position().top;
        const width = mainCanvas.width() || 0;
        const paddingBetweenZoneAndMainCanvas = 35;
        // start align
        anvilLayout.DragDropAnvilWidgetNVerify(
          WIDGET.WDSBUTTON,
          x + 10,
          y + paddingBetweenZoneAndMainCanvas * 0.5,
          {
            skipWidgetSearch: true,
          },
        );
        // center align
        anvilLayout.DragDropAnvilWidgetNVerify(
          WIDGET.WDSBUTTON,
          x + (width - 2 * paddingBetweenZoneAndMainCanvas) / 2,
          y + paddingBetweenZoneAndMainCanvas * 0.5,
          {
            skipWidgetSearch: true,
            dropTargetDetails: {
              name: "Zone1",
            },
          },
        );
        // end align
        anvilLayout.DragDropAnvilWidgetNVerify(
          WIDGET.WDSBUTTON,
          x + (width - 2 * paddingBetweenZoneAndMainCanvas),
          y + paddingBetweenZoneAndMainCanvas * 0.5,
          {
            skipWidgetSearch: true,
            dropTargetDetails: {
              name: "Zone1",
            },
          },
        );
        agHelper.AssertElementLength(
          locators._anvilWidgetInCanvas(WIDGET.WDSBUTTON),
          3,
        );
      });
    });
  },
);
