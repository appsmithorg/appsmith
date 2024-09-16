import type { LoDashStatic } from "lodash";
import type { SelectWidgetProps } from ".";
import type { ValidationResponse } from "constants/WidgetValidation";
import { get, isArray, isString, isPlainObject, uniq } from "lodash";
import type { WidgetProps } from "../../BaseWidget";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";

export function defaultOptionValueValidation(
  value: unknown,
  props: SelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  let isValid;
  let parsed;
  let message = { name: "", message: "" };
  /*
   * Function to check if the object has `label` and `value`
   */
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasLabelValue = (obj: any) => {
    return (
      _.isPlainObject(value) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  /*
   * When value is "{label: 'green', value: 'green'}"
   */
  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);
      if (_.isObject(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {}
  }

  if (_.isString(value) || _.isFinite(value) || hasLabelValue(value)) {
    /*
     * When value is "", "green", 444, {label: "green", value: "green"}
     */
    isValid = true;
    parsed = value;
  } else {
    isValid = false;
    parsed = undefined;
    message = {
      name: "TypeError",
      message:
        'value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }',
    };
  }

  return {
    isValid,
    parsed,
    messages: [message],
  };
}

export function getLabelValueKeyOptions(widget: WidgetProps) {
  const sourceData = get(widget, `${EVAL_VALUE_PATH}.sourceData`);

  let parsedValue: Record<string, unknown> | undefined = sourceData;

  if (isString(sourceData)) {
    try {
      parsedValue = JSON.parse(sourceData);
    } catch (e) {}
  }

  if (isArray(parsedValue)) {
    return uniq(
      parsedValue.reduce((keys, obj) => {
        if (isPlainObject(obj)) {
          Object.keys(obj).forEach((d) => keys.push(d));
        }

        return keys;
      }, []),
    ).map((d: unknown) => ({
      label: d,
      value: d,
    }));
  } else {
    return [];
  }
}

export function getLabelValueAdditionalAutocompleteData(props: WidgetProps) {
  const keys = getLabelValueKeyOptions(props);

  return {
    item: keys
      .map((d) => d.label)
      .reduce((prev: Record<string, string>, curr: unknown) => {
        prev[curr as string] = "";

        return prev;
      }, {}),
  };
}

export function labelKeyValidation(
  value: unknown,
  props: SelectWidgetProps,
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

export function valueKeyValidation(
  value: unknown,
  props: SelectWidgetProps,
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
