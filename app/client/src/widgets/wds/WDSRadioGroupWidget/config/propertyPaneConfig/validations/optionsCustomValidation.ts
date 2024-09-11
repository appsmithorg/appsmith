import type { ValidationResponse } from "constants/WidgetValidation";

/**
 * Validation rules:
 * 1. This property will take the value in the following format: Array<{ "label": "string", "value": "string" | number}>
 * 2. The `value` property should consists of unique values only.
 * 3. Data types of all the value props should be the same.
 */
export function optionsCustomValidation(
  options: unknown,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
  const validationUtil = (
    options: { label: string; value: string | number }[],
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
  ) => {
    let _isValid = true;
    let message = { name: "", message: "" };
    let valueType = "";
    const uniqueLabels: Record<string | number, string> = {};

    for (let i = 0; i < options.length; i++) {
      const { label, value } = options[i];
      if (!valueType) {
        valueType = typeof value;
      }
      //Checks the uniqueness all the values in the options
      if (!uniqueLabels.hasOwnProperty(value)) {
        uniqueLabels[value] = "";
      } else {
        _isValid = false;
        message = {
          name: "ValidationError",
          message: "path:value must be unique. Duplicate values found",
        };
        break;
      }

      //Check if the required field "label" is present:
      if (!label) {
        _isValid = false;
        message = {
          name: "ValidationError",
          message:
            "Invalid entry at index: " + i + ". Missing required key: label",
        };
        break;
      }

      //Validation checks for the the label.
      if (
        _.isNil(label) ||
        label === "" ||
        (typeof label !== "string" && typeof label !== "number")
      ) {
        _isValid = false;
        message = {
          name: "ValidationError",
          message:
            "Invalid entry at index: " +
            i +
            ". Value of key: label is invalid: This value does not evaluate to type string",
        };
        break;
      }

      //Check if all the data types for the value prop is the same.
      if (typeof value !== valueType) {
        _isValid = false;
        message = {
          name: "TypeError",
          message: "All value properties in options must have the same type",
        };
        break;
      }

      //Check if the each object has value property.
      if (_.isNil(value)) {
        _isValid = false;
        message = {
          name: "TypeError",
          message:
            'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
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
    if (_.isString(options)) {
      options = JSON.parse(options as string);
    }

    if (Array.isArray(options)) {
      return validationUtil(options, _);
    } else {
      return invalidResponse;
    }
  } catch (e) {
    return invalidResponse;
  }
}
