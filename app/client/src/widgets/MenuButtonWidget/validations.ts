import { ValidationResponse } from "constants/WidgetValidation";
import { MenuButtonWidgetProps } from "./constants";

export function arrayOfValuesWithMaxLengthTen(
  options: unknown,
  props: MenuButtonWidgetProps,
  _: any,
): ValidationResponse {
  const validationUtil = (
    options: { label: string; value: string | number }[],
  ) => {
    let _isValid = true;
    let message = "";

    if (options.length > 10) {
      _isValid = false;
      message = "Source data cannot have more than 10 items";
    }

    return {
      isValid: _isValid,
      parsed: _isValid ? options : [],
      messages: [message],
    };
  };

  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: ["This value does not evaluate to type Array"],
  };

  try {
    if (_.isString(options)) {
      options = JSON.parse(options as string);
    }

    if (Array.isArray(options)) {
      return validationUtil(options);
    } else {
      return invalidResponse;
    }
  } catch (e) {
    return invalidResponse;
  }
}
