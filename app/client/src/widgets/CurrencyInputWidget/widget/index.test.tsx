import type { CurrencyInputWidgetProps } from "./index";
import CurrencyInputWidget, { defaultValueValidation } from "./index";
import _ from "lodash";

describe("defaultValueValidation", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;

  it("should validate defaulttext", () => {
    result = defaultValueValidation("100", {} as CurrencyInputWidgetProps, _);

    expect(result).toEqual({
      isValid: true,
      parsed: "100",
      messages: [{ name: "", message: "" }],
    });

    result = defaultValueValidation("test", {} as CurrencyInputWidgetProps, _);

    expect(result).toEqual({
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "TypeError",
          message: "This value must be number",
        },
      ],
    });

    result = defaultValueValidation("", {} as CurrencyInputWidgetProps, _);

    expect(result).toEqual({
      isValid: true,
      parsed: undefined,
      messages: [{ name: "", message: "" }],
    });
  });

  it("should validate defaulttext with object value", () => {
    const value = {};

    result = defaultValueValidation(value, {} as CurrencyInputWidgetProps, _);

    expect(result).toEqual({
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [
        {
          name: "TypeError",
          message: "This value must be number",
        },
      ],
    });
  });
});

describe("CurrencyInputWidget getWidgetView", () => {
  it.each([true, false])(
    "should pass isRequired=%s to the component",
    (isRequired) => {
      const widget = new CurrencyInputWidget({
        isRequired,
        label: "Salary",
        text: "",
        widgetId: "currency-input-widget",
      } as unknown as CurrencyInputWidgetProps);

      expect(widget.getWidgetView().props.isRequired).toBe(isRequired);
    },
  );
});
