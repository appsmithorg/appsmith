import { defaultValueValidation, CurrencyInputWidgetProps } from "./index";
import _ from "lodash";
import { ErrorMessageType } from "entities/AppsmithConsole";

describe("defaultValueValidation", () => {
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
          name: ErrorMessageType.TYPE_ERROR,
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
          name: ErrorMessageType.TYPE_ERROR,
          message: "This value must be number",
        },
      ],
    });
  });
});
