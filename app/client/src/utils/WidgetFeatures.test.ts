import { RenderModes } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import type { WidgetType } from "constants/WidgetConstants";
import {
  DynamicHeight,
  hideDynamicHeightPropertyControl,
  PropertyPaneConfigTemplates,
  RegisteredWidgetFeatures,
  WidgetFeaturePropertyPaneEnhancements,
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

describe("Height control options", () => {
  const getHeightOptions = (widgetType: WidgetType) => {
    const config = [
      {
        sectionName: "General",
        children: PropertyPaneConfigTemplates[
          RegisteredWidgetFeatures.DYNAMIC_HEIGHT
        ]({ active: true, sectionIndex: 0 }),
      },
    ];
    const [section] = WidgetFeaturePropertyPaneEnhancements[
      RegisteredWidgetFeatures.DYNAMIC_HEIGHT
    ](config, widgetType);
    const heightControl = section.children?.find(
      (control) =>
        (control as PropertyPaneControlConfig).propertyName === "dynamicHeight",
    ) as PropertyPaneControlConfig & { options: { value: string }[] };

    return heightControl.options.map(
      (option: { value: string }) => option.value,
    );
  };

  it.each(["MODAL_WIDGET", "TABLE_WIDGET_V2"])(
    "offers only Auto Height and Fixed for %s",
    (widgetType) => {
      expect(getHeightOptions(widgetType)).toEqual([
        DynamicHeight.AUTO_HEIGHT,
        DynamicHeight.FIXED,
      ]);
    },
  );

  it("offers Auto Height with limits for other widgets", () => {
    expect(getHeightOptions("TEXT_WIDGET")).toEqual([
      DynamicHeight.AUTO_HEIGHT,
      DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
      DynamicHeight.FIXED,
    ]);
  });
});
