import type { ValidationResponse } from "constants/WidgetValidation";
import type { LoDashStatic } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";

interface ValidationErrorMessage {
  name: string;
  message: string;
}

interface ValidationErrorMessage {
  name: string;
  message: string;
}

export function defaultOptionValidation(
  value: unknown,
  widgetProps: WidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  // UTILS
  const isTrueObject = (item: unknown): item is Record<string, unknown> => {
    return Object.prototype.toString.call(item) === "[object Object]";
  };

  const createErrorValidationResponse = (
    value: unknown,
    message: ValidationErrorMessage,
  ): ValidationResponse => ({
    isValid: false,
    parsed: value,
    messages: [message],
  });

  const createSuccessValidationResponse = (
    value: unknown,
  ): ValidationResponse => ({
    isValid: true,
    parsed: value,
  });

  const { options } = widgetProps;

  if (value === "") {
    return createSuccessValidationResponse(value);
  }

  // Is Form mode, otherwise it is JS mode
  if (Array.isArray(options)) {
    const values = _.map(widgetProps.options, (option) => {
      if (isTrueObject(option)) {
        return option["value"];
      }
    });

    if (!values.includes(value)) {
      return createErrorValidationResponse(value, {
        name: "ValidationError",
        message:
          "Default value is missing in options. Please update the value.",
      });
    }

    return createSuccessValidationResponse(value);
  }

  return createSuccessValidationResponse(value);
}
