import type { WidgetProps } from "widgets/BaseWidget";
import { handleWidgetTypeUpdate } from "./contentConfig";

describe("handleWidgetTypeUpdate", () => {
  it("should update the widget type and type property", () => {
    const props = {} as WidgetProps;
    const propertyName = "widgetType";
    const propertyValue = "COMBOBOX";

    expect(handleWidgetTypeUpdate(props, propertyName, propertyValue)).toEqual([
      {
        propertyPath: propertyName,
        propertyValue: propertyValue,
      },
      {
        propertyPath: "type",
        propertyValue: "WDS_COMBOBOX_WIDGET",
      },
    ]);
  });

  it("should not update the type property for unknown widget type", () => {
    const props = {} as WidgetProps;
    const propertyName = "widgetType";
    const propertyValue = "UNKNOWN";

    // @ts-expect-error unknown widget type
    expect(handleWidgetTypeUpdate(props, propertyName, propertyValue)).toEqual([
      {
        propertyPath: propertyName,
        propertyValue: propertyValue,
      },
    ]);
  });
});
