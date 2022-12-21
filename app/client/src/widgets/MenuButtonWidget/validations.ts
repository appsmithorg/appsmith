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

export function labelForEachRowValidation(
  value: unknown,
  props: MenuButtonWidgetProps,
  _: any,
): ValidationResponse {
  const generateResponseAndReturn = (isValid = false, message = "") => {
    return {
      isValid,
      parsed: isValid ? value : [],
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE =
    "The evaluated value should either be a string, an array, or a nested array (of values, of objects, or of arrays).";

  if (!value) {
    return generateResponseAndReturn(
      false,
      `A value is required. ${DEFAULT_MESSAGE}`,
    );
  }

  if (value === null) {
    return generateResponseAndReturn(
      false,
      `The value is cannot be null. ${DEFAULT_MESSAGE}`,
    );
  }

  if (value === undefined) {
    return generateResponseAndReturn(
      false,
      `The value is cannot be undefined. ${DEFAULT_MESSAGE}`,
    );
  }

  if (_.isBoolean(value)) {
    return generateResponseAndReturn(
      false,
      `The value is cannot be a boolean. ${DEFAULT_MESSAGE}`,
    );
  }

  if (_.isString(value) || _.isNumber(value) || Array.isArray(value)) {
    return generateResponseAndReturn(true);
  }

  // Return a message if the value is none of the above
  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}
