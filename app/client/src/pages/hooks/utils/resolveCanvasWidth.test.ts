import { layoutConfigurations } from "constants/WidgetConstants";
import { resolveCanvasWidth } from "./resolveCanvasWidth";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";

const layoutTestConfigs = Object.entries(layoutConfigurations)
  .filter(([key]) => key !== "FLUID")
  .map(([key, widths]) => {
    const appLayoutType = key as SupportedLayouts;
    return [
      appLayoutType,
      {
        ...widths,
      },
    ] as const;
  });

describe("resolveCanvasWidth", () => {
  test.each(layoutTestConfigs)(
    "results are within range for %s",
    (appLayoutType, { maxWidth, minWidth }) => {
      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: maxWidth,
        }),
      ).toBe(maxWidth);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: minWidth,
        }),
      ).toBe(minWidth);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: maxWidth - 1,
        }),
      ).toBe(maxWidth - 1);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: minWidth + 1,
        }),
      ).toBe(minWidth + 1);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: -1,
        }),
      ).toBe(minWidth);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: layoutConfigurations[appLayoutType].minWidth - 1,
        }),
      ).toBe(minWidth);

      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: Infinity,
        }),
      ).toBe(maxWidth);
    },
  );

  it("results are within range for FLUID", () => {
    const appLayoutType = "FLUID";

    const widths = {
      min: 0,
      sm: 576,
      md: 768,
      lg: 1200,
      max: Infinity,
    };

    for (const width of Object.values(widths)) {
      expect(
        resolveCanvasWidth({
          appLayoutType,
          containerWidth: width,
        }),
      ).toEqual(width);
    }
  });
});
