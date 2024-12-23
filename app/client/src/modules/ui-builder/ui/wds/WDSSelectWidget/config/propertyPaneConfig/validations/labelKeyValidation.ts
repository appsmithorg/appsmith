import type { LoDashStatic } from "lodash";

import type { WDSSelectWidgetProps } from "../../../widget/types";

export function labelKeyValidation(
  value: unknown,
  props: WDSSelectWidgetProps,
  _: LoDashStatic,
) {
  /*
   * Validation rules
   *  1. Can be a string.
   *  2. Can be an Array of string, number, boolean (only for option Value).
   */

  if (value === "" || _.isNil(value)) {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `value does not evaluate to type: string | Array<string>`,
        },
      ],
    };
  }

  if (_.isString(value)) {
    return {
      parsed: value,
      isValid: true,
      messages: [],
    };
  } else if (_.isArray(value)) {
    const errorIndex = value.findIndex((d) => !_.isString(d));

    return {
      parsed: errorIndex === -1 ? value : [],
      isValid: errorIndex === -1,
      messages:
        errorIndex !== -1
          ? [
              {
                name: "ValidationError",
                message: `Invalid entry at index: ${errorIndex}. This value does not evaluate to type: string`,
              },
            ]
          : [],
    };
  } else {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "value does not evaluate to type: string | Array<string>",
        },
      ],
    };
  }
}
