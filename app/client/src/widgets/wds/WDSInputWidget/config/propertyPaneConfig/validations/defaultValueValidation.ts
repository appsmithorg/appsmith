import type { LoDashStatic } from "lodash";

import type { InputWidgetProps } from "../../../widget/types";

export function defaultValueValidation(
  value: unknown,
  props: InputWidgetProps,
  _: LoDashStatic,
) {
  const STRING_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be string",
  };
  const NUMBER_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be number",
  };
  const EMPTY_ERROR_MESSAGE = { name: "", message: "" };

  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [STRING_ERROR_MESSAGE],
    };
  }

  const { inputType } = props;

  if (_.isBoolean(value) || _.isNil(value) || _.isUndefined(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: [STRING_ERROR_MESSAGE],
    };
  }

  let parsed;

  switch (inputType) {
    case "NUMBER":
      parsed = Number(value);
      let isValid, messages;

      // Case 1: When value is empty string
      if (_.isString(value) && value.trim() === "") {
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
        parsed = null;
      }
      // Case 2: When parsed value is not a finite numer
      else if (!Number.isFinite(parsed)) {
        isValid = false;
        messages = [NUMBER_ERROR_MESSAGE];
        parsed = null;
      }
      // Case 3: When parsed value is a Number
      else {
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
      }

      return { isValid, parsed, messages };
    case "TEXT":
    case "MULTI_LINE_TEXT":
    case "PASSWORD":
    case "EMAIL":
      parsed = value;

      if (!_.isString(parsed)) {
        try {
          parsed = _.toString(parsed);
        } catch (e) {
          return {
            isValid: false,
            parsed: "",
            messages: [STRING_ERROR_MESSAGE],
          };
        }
      }

      return {
        isValid: _.isString(parsed),
        parsed: parsed,
        messages: [EMPTY_ERROR_MESSAGE],
      };
    default:
      return {
        isValid: false,
        parsed: "",
        messages: [STRING_ERROR_MESSAGE],
      };
  }
}
