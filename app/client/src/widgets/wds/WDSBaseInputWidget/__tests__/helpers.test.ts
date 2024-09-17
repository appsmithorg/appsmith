import type { WidgetProps } from "widgets/BaseWidget";
import { isReadOnlyUpdateHook } from "../helpers";

describe("isReadOnlyUpdateHook", () => {
  it("should return the correct updates for input widget", () => {
    const props1 = {
      type: "WDS_INPUT_WIDGET",
      inputType: "TEXT",
    } as unknown as WidgetProps;

    const updates = isReadOnlyUpdateHook(props1, "readOnly", true);
    expect(updates).toEqual([
      { propertyPath: "readOnly", propertyValue: true },
      { propertyPath: "type", propertyValue: "WDS_KEY_VALUE_WIDGET" },
    ]);

    const updates2 = isReadOnlyUpdateHook(props1, "readOnly", false);
    expect(updates2).toEqual([
      { propertyPath: "readOnly", propertyValue: false },
      { propertyPath: "type", propertyValue: "WDS_INPUT_WIDGET" },
    ]);

    const props2 = {
      type: "WDS_EMAIL_INPUT_WIDGET",
      inputType: "EMAIL",
    } as unknown as WidgetProps;

    const updates3 = isReadOnlyUpdateHook(props2, "readOnly", true);
    expect(updates3).toEqual([
      { propertyPath: "readOnly", propertyValue: true },
      { propertyPath: "type", propertyValue: "WDS_KEY_VALUE_WIDGET" },
    ]);

    const updates4 = isReadOnlyUpdateHook(props2, "readOnly", false);
    expect(updates4).toEqual([
      { propertyPath: "readOnly", propertyValue: false },
      { propertyPath: "type", propertyValue: "WDS_EMAIL_INPUT_WIDGET" },
    ]);
  });

  it("should not change the type for currency widget", () => {
    const props = {
      type: "WDS_CURRENCY_INPUT_WIDGET",
      inputType: "CURRENCY",
    } as unknown as WidgetProps;

    const updates = isReadOnlyUpdateHook(props, "readOnly", true);
    expect(updates).toEqual([
      { propertyPath: "readOnly", propertyValue: true },
    ]);
  });

  it("should not change the type for phone widget", () => {
    const props = {
      type: "WDS_PHONE_INPUT_WIDGET",
      inputType: "PHONE",
    } as unknown as WidgetProps;

    const updates = isReadOnlyUpdateHook(props, "readOnly", true);
    expect(updates).toEqual([
      { propertyPath: "readOnly", propertyValue: true },
    ]);
  });
});
