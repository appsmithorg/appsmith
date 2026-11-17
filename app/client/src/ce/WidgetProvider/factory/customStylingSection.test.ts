import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { addCustomStylingSection } from "ee/WidgetProvider/factory/customStylingSection";

describe("addCustomStylingSection (CE)", () => {
  it("returns the same config reference with unchanged contents", () => {
    const config: PropertyPaneConfig[] = [
      {
        sectionName: "Color",
        children: [{ propertyName: "textColor", label: "Text color" }],
      } as PropertyPaneConfig,
    ];
    const snapshot = JSON.parse(JSON.stringify(config));

    const result = addCustomStylingSection("TEXT_WIDGET", config);

    expect(result).toBe(config);
    expect(result).toEqual(snapshot);
  });

  it("returns undefined when the widget has no config", () => {
    expect(addCustomStylingSection("TEXT_WIDGET", undefined)).toBeUndefined();
  });
});
