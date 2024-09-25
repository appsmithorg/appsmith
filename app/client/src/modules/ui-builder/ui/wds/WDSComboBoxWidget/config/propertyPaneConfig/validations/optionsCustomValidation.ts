import type { ValidationResponse } from "constants/WidgetValidation";
import type { LoDashStatic } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";

interface ValidationErrorMessage {
  name: string;
  message: string;
}

/**
 * Validation rules:
 * 1. This property will take the value in the following format: Array<{ "label": "string", "value": "string" | number}>
 * 2. The `value` property should consists of unique values only.
 * 3. Data types of all the value props should be the same.
 */
export function optionsCustomValidation(
  options: unknown,
  _props: WidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  // UTILS
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

  const hasDuplicates = (array: unknown[]): boolean =>
    new Set(array).size !== array.length;

  if (Array.isArray(options)) {
    const isValidKeys = options.every((option) => {
      return (
        _.isPlainObject(option) &&
        _.has(option, "label") &&
        _.has(option, "value")
      );
    });

    if (!isValidKeys) {
      return createErrorValidationResponse(options, {
        name: "ValidationError",
        message:
          'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
      });
    }

    return createSuccessValidationResponse(options);
  }

  // JS expects options to be a string
  if (!_.isString(options)) {
    return createErrorValidationResponse(options, {
      name: "TypeError",
      message: "This value does not evaluate to type string",
    });
  }

  const validationUtil = (options: unknown[]) => {
    let _isValid = true;
    let message = { name: "", message: "" };

    if (options.length === 0) {
      return createErrorValidationResponse(options, {
        name: "ValidationError",
        message: "Options cannot be an empty array",
      });
    }

    const isValidKeys = options.every((option) => {
      return (
        _.isPlainObject(option) &&
        _.has(option, "label") &&
        _.has(option, "value")
      );
    });

    if (!isValidKeys) {
      return createErrorValidationResponse(options, {
        name: "ValidationError",
        message:
          'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
      });
    }

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (!_.isPlainObject(option)) {
        _isValid = false;
        message = {
          name: "ValidationError",
          message: "This value does not evaluate to type Object",
        };
        break;
      }

      if (_.keys(option).length === 0) {
        _isValid = false;
        message = {
          name: "ValidationError",
          message:
            'This value does not evaluate to type { "label": "string", "value": "string" | number }',
        };
        break;
      }

      if (hasDuplicates(_.keys(option))) {
        _isValid = false;
        message = {
          name: "ValidationError",
          message: "All the keys must be unique",
        };
        break;
      }
    }

    return {
      isValid: _isValid,
      parsed: _isValid ? options : [],
      messages: [message],
    };
  };

  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: [
      {
        name: "TypeError",
        message:
          'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
      },
    ],
  };

  try {
    options = JSON.parse(options as string);

    if (!Array.isArray(options)) {
      return invalidResponse;
    }

    return validationUtil(options);
  } catch (_error) {
    return invalidResponse;
  }
}
