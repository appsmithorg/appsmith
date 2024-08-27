import type { ValidationResponse } from "constants/WidgetValidation";

interface ValidationErrorMessage {
  name: string;
  message: string;
}

export function defaultOptionValidation(
  value: unknown,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
  const errorMessages = {
    evaluationTypeError: {
      name: "TypeError",
      message: "This value does not evaluate to type: string or number",
    },
    defaultOptionMissingError: {
      name: "ValidationError",
      message: "Default value is missing in options. Please update the value.",
    },
  };

  const createErrorValidationResponse = (
    value: unknown,
    messages: ValidationErrorMessage[],
  ): ValidationResponse => ({
    isValid: false,
    parsed: value,
    messages,
  });

  const createSuccessValidationResponse = (
    value: unknown,
  ): ValidationResponse => ({
    isValid: true,
    parsed: value,
  });

  let { options } = props;

  if (_.isObject(value) || _.isBoolean(value)) {
    return createErrorValidationResponse(JSON.stringify(value, null, 2), [
      errorMessages.evaluationTypeError,
    ]);
  }

  if (!Array.isArray(options) && typeof options === "string") {
    try {
      const parsedOptions = JSON.parse(options);

      if (Array.isArray(parsedOptions)) {
        options = parsedOptions;
      } else {
        options = [];
      }
    } catch (e) {
      options = [];
    }
  }

  if (typeof value === "string") {
    // Empty string is a valid value and used to represent no selection in the Select
    if (value.length === 0) {
      return createSuccessValidationResponse(value);
    }

    // Check if the default value is present in the options
    // @ts-expect-error type mismatch
    const valueIndex = _.findIndex(options, (option) => option.value === value);

    if (valueIndex === -1) {
      return createErrorValidationResponse(value, [
        errorMessages.defaultOptionMissingError,
      ]);
    }
  }

  return createSuccessValidationResponse(value);
}
