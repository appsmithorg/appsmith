import type { LoDashStatic } from "lodash";
import type { ValidationResponse } from "constants/WidgetValidation";

import type { WDSMultiSelectWidgetProps } from "../../../widget/types";

/**
 * Validation rules:
 * 1. Can be a string, number, or an object with "label" and "value" properties.
 * 2. If it's a string, it should be a valid JSON string.
 */
export function defaultOptionValueValidation(
  value: unknown,
  props: WDSMultiSelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  function isValidSelectOption(value: unknown): boolean {
    if (!_.isPlainObject(value)) return false;

    const obj = value as Record<string, unknown>;

    return (
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  }

  function tryParseJSON(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  const processedValue =
    typeof value === "string" ? tryParseJSON(value) : value;

  const isValid =
    _.isString(processedValue) ||
    _.isFinite(processedValue) ||
    isValidSelectOption(processedValue);

  return {
    isValid,
    parsed: isValid ? processedValue : undefined,
    messages: [
      {
        name: isValid ? "" : "TypeError",
        message: isValid
          ? ""
          : 'Value must be a string, number, or an object with "label" and "value" properties',
      },
    ],
  };
}
