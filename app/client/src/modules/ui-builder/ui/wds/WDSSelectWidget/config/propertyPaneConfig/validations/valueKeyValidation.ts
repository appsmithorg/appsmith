import type { LoDashStatic } from "lodash";
import type { WDSSelectWidgetProps } from "../../../widget/types";

export function valueKeyValidation(
  value: unknown,
  props: WDSSelectWidgetProps,
  _: LoDashStatic,
) {
  /*
   * Validation rules
   *  1. Can be a string.
   *  2. Can be an Array of string, number, boolean (only for option Value).
   *  3. should be unique.
   */

  if (value === "" || _.isNil(value)) {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `value does not evaluate to type: string | Array<string| number | boolean>`,
        },
      ],
    };
  }

  let options: unknown[] = [];

  if (_.isString(value)) {
    const sourceData = _.isArray(props.sourceData) ? props.sourceData : [];

    const keys = sourceData.reduce((keys, curr) => {
      Object.keys(curr).forEach((d) => keys.add(d));

      return keys;
    }, new Set());

    if (!keys.has(value)) {
      return {
        parsed: value,
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `value key should be present in the source data`,
          },
        ],
      };
    }

    options = sourceData.map((d: Record<string, unknown>) => d[value]);
  } else if (_.isArray(value)) {
    /*
     * Here assumption is that if evaluated array is all equal, then it is a key,
     * and we can return the parsed value(from source data) as the options.
     */
    const areAllValuesEqual = value.every((item, _, arr) => item === arr[0]);

    if (
      areAllValuesEqual &&
      props.sourceData[0].hasOwnProperty(String(value[0]))
    ) {
      const parsedValue = props.sourceData.map(
        (d: Record<string, unknown>) => d[String(value[0])],
      );

      return {
        parsed: parsedValue,
        isValid: true,
        messages: [],
      };
    }

    const errorIndex = value.findIndex(
      (d) =>
        !(_.isString(d) || (_.isNumber(d) && !_.isNaN(d)) || _.isBoolean(d)),
    );

    if (errorIndex !== -1) {
      return {
        parsed: [],
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `Invalid entry at index: ${errorIndex}. This value does not evaluate to type: string | number | boolean`,
          },
        ],
      };
    } else {
      options = value;
    }
  } else {
    return {
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message:
            "value does not evaluate to type: string | Array<string | number | boolean>",
        },
      ],
    };
  }

  const isValid = options.every(
    (d: unknown, i: number, arr: unknown[]) => arr.indexOf(d) === i,
  );

  return {
    parsed: value,
    isValid: isValid,
    messages: isValid
      ? []
      : [
          {
            name: "ValidationError",
            message: "Duplicate values found, value must be unique",
          },
        ],
  };
}
