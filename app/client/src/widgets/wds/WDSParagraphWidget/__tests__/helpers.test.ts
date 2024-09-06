import type { WidgetProps } from "widgets/BaseWidget";
import { fontSizeUpdateHook } from "../helpers";

describe("fontSizeUpdateHook", () => {
  it("should update the font size and type", () => {
    const props = {
      type: "WDS_PARAGRAPH_WIDGET",
    } as unknown as WidgetProps;

    const updates = fontSizeUpdateHook(props, "fontSize", "heading");

    expect(updates).toEqual([
      { propertyPath: "fontSize", propertyValue: "heading" },
      { propertyPath: "type", propertyValue: "WDS_HEADING_WIDGET" },
    ]);

    const updates2 = fontSizeUpdateHook(props, "fontSize", "body");

    expect(updates2).toEqual([
      { propertyPath: "fontSize", propertyValue: "body" },
      { propertyPath: "type", propertyValue: "WDS_PARAGRAPH_WIDGET" },
    ]);

    const updates3 = fontSizeUpdateHook(props, "fontSize", "subtitle");

    expect(updates3).toEqual([
      { propertyPath: "fontSize", propertyValue: "subtitle" },
      { propertyPath: "type", propertyValue: "WDS_HEADING_WIDGET" },
    ]);

    const updates4 = fontSizeUpdateHook(props, "fontSize", "title");

    expect(updates4).toEqual([
      { propertyPath: "fontSize", propertyValue: "title" },
      { propertyPath: "type", propertyValue: "WDS_HEADING_WIDGET" },
    ]);
  });
});
