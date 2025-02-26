import type { LoDashStatic } from "lodash";
import type { ValidationResponse } from "constants/WidgetValidation";

import type { WDSSelectWidgetProps } from "../../../widget/types";

/**
 * Validation rules:
 * 1. Can be a string
 * 2. Can be an Array of strings
 */
export function labelKeyValidation(
  value: unknown,
  props: WDSSelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  if (value === "" || _.isNil(value)) {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "Value cannot be empty or null",
        },
      ],
    };
  }

  // Handle string values
  if (_.isString(value)) {
    return {
      parsed: value,
      isValid: true,
      messages: [{ name: "", message: "" }],
    };
  }

  // Handle array values
  if (_.isArray(value)) {
    const errorIndex = value.findIndex((item) => !_.isString(item));
    const isValid = errorIndex === -1;

    return {
      parsed: isValid ? value : [],
      isValid,
      messages: [
        {
          name: isValid ? "" : "ValidationError",
          message: isValid
            ? ""
            : `Invalid entry at index: ${errorIndex}. Value must be a string`,
        },
      ],
    };
  }

  // Handle invalid types
  return {
    parsed: "",
    isValid: false,
    messages: [
      {
        name: "ValidationError",
        message: "Value must be a string or an array of strings",
      },
    ],
  };
}
