import type { CurrencyInputWidgetProps } from "./index";
import { defaultValueValidation } from "./index";
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

  it("should preserve decimal precision for valid string defaults", () => {
    result = defaultValueValidation(
      "123.00",
      { decimals: 2 } as CurrencyInputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "123.00",
      messages: [{ name: "", message: "" }],
    });

    result = defaultValueValidation(
      "4.10",
      { decimals: 2 } as CurrencyInputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "4.10",
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
