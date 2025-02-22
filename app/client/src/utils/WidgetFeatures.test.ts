import { RenderModes } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  DynamicHeight,
  hideDynamicHeightPropertyControl,
} from "./WidgetFeatures";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Widget Features tests", () => {
  it("Make sure hidden hook for dynamic Height disables if dynamic height is disabled", () => {
    const inputs = [
      DynamicHeight.FIXED,
      "Some other value",
      undefined,
      null,
      "hugcontents",
      "hug_contents",
    ];

    inputs.forEach((dynamicHeight) => {
      const result = hideDynamicHeightPropertyControl({
        ...DUMMY_WIDGET,
        dynamicHeight,
      });

      expect(result).toBe(true);
    });
  });
  it("Make sure hidden hook for dynamic Height disabled if dynamic height with limits is disabled", () => {
    const inputs = [DynamicHeight.AUTO_HEIGHT, "AUTO_HEIGHT"];

    inputs.forEach((dynamicHeight) => {
      const result = hideDynamicHeightPropertyControl({
        ...DUMMY_WIDGET,
        dynamicHeight,
      });

      expect(result).toBe(true);
    });
  });
  it("Make sure hidden hook for dynamic Height enabled if dynamic height with limits is enabled", () => {
    const inputs = [
      DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
      "AUTO_HEIGHT_WITH_LIMITS",
    ];

    inputs.forEach((dynamicHeight) => {
      const result = hideDynamicHeightPropertyControl({
        ...DUMMY_WIDGET,
        dynamicHeight,
      });

      expect(result).toBe(false);
    });
  });
});
