import type { LoDashStatic } from "lodash";
import type { PhoneInputWidgetProps } from "../../../types";

export function defaultValueValidation(
  value: any,
  props: PhoneInputWidgetProps,
  _: LoDashStatic,
) {
  const STRING_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be string",
  };
  const EMPTY_ERROR_MESSAGE = { name: "", message: "" };
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [STRING_ERROR_MESSAGE],
    };
  }
  let parsed = value;
  if (!_.isString(value)) {
    try {
      parsed = _.toString(value);
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
}
