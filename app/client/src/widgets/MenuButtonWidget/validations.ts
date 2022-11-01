import { ValidationResponse } from "constants/WidgetValidation";
import { MenuButtonWidgetProps } from "./constants";

/**
 * Checks if the source data array
 * - is Array
 * - has a max length of 10
 */
export function sourceDataArrayValidation(
  options: unknown,
  props: MenuButtonWidgetProps,
  _: any,
): ValidationResponse {
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
      let isValid = true;
      let message = "";

      if (options.length > 10) {
        isValid = false;
        message = "Source data cannot have more than 10 items";
      }

      return {
        isValid,
        parsed: isValid ? options : [],
        messages: [message],
      };
    } else {
      return invalidResponse;
    }
  } catch (e) {
    return invalidResponse;
  }
}
