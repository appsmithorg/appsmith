import type { LoDashStatic } from "lodash";
import type { ValidationResponse } from "constants/WidgetValidation";
import type { WDSMultiSelectWidgetProps } from "../../../widget/types";

interface LabelValue {
  label: string;
  value: string;
}

export function defaultOptionValueValidation(
  value: unknown,
  props: WDSMultiSelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  let isValid = false;
  let parsed: LabelValue[] | (string | number)[] = [];
  let message = { name: "", message: "" };

  const DEFAULT_ERROR_MESSAGE = {
    name: "TypeError",
    message:
      "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
  };

  const hasLabelValue = (obj: LabelValue): obj is LabelValue => {
    return (
      _.isPlainObject(obj) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  const hasUniqueValues = (arr: Array<string>) => {
    const uniqueValues = new Set(arr);

    return uniqueValues.size === arr.length;
  };

  // When value is "['green', 'red']", "[{label: 'green', value: 'green'}]" and "green, red"
  if (_.isString(value) && value.trim() !== "") {
    try {
      // when value is "['green', 'red']", "[{label: 'green', value: 'green'}]"
      const parsedValue = JSON.parse(value) as
        | (string | number)[]
        | LabelValue[];

      // Only parse value if resulting value is an array or string
      if (Array.isArray(parsedValue) || _.isString(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {
      // when value is "green, red", JSON.parse throws error
      const splitByComma = (value as string).split(",") || [];

      value = splitByComma.map((s) => s.trim());
    }
  }

  // When value is "['green', 'red']", "[{label: 'green', value: 'green'}]" and "green, red"
  if (Array.isArray(value)) {
    if (value.every((val) => _.isString(val) || _.isFinite(val))) {
      // When value is ["green", "red"]
      if (hasUniqueValues(value)) {
        isValid = true;
        parsed = value;
      } else {
        parsed = [];
        message = {
          name: "ValidationError",
          message: "values must be unique. Duplicate values found",
        };
      }
    } else if (value.every(hasLabelValue)) {
      // When value is [{label: "green", value: "red"}]
      if (hasUniqueValues(value.map((val) => val.value))) {
        isValid = true;
        parsed = value;
      } else {
        parsed = [];
        message = {
          name: "ValidationError",
          message: "path:value must be unique. Duplicate values found",
        };
      }
    } else {
      // When value is [true, false], [undefined, undefined] etc.
      parsed = [];
      message = DEFAULT_ERROR_MESSAGE;
    }
  } else if (_.isString(value) && value.trim() === "") {
    // When value is an empty string
    isValid = true;
    parsed = [];
  } else if (_.isNumber(value) || _.isString(value)) {
    // When value is a number or just a single string e.g "Blue"
    isValid = true;
    parsed = [value];
  } else {
    // When value is undefined, null, {} etc.
    parsed = [];
    message = DEFAULT_ERROR_MESSAGE;
  }

  return {
    isValid,
    parsed,
    messages: [message],
  };
}
