/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ValidationTypes,
  ValidationResponse,
  Validator,
} from "../constants/WidgetValidation";
import { isObject, isPlainObject, isString, toString } from "lodash";

import moment from "moment";
import { ValidationConfig } from "constants/PropertyControlConstants";

function validatePlainObject(
  config: ValidationConfig,
  value: Record<string, unknown>,
  props: Record<string, unknown>,
) {
  if (config.params?.allowedKeys) {
    let _valid = true;
    const _messages: string[] = [];
    config.params.allowedKeys.forEach((entry) => {
      if (value.hasOwnProperty(entry.name)) {
        const { isValid, message } = validate(entry, value[entry.name], props);
        _valid = isValid;
        message && _messages.push(message);
      } else if (entry.params?.required) {
        return {
          isValid: false,
          parsed: value,
          message: `Missing required key: ${entry.name}`,
        };
      }
    });
    if (_valid) {
      return {
        isValid: true,
        parsed: value,
      };
    }
    return {
      isValid: false,
      parsed: config.params?.default || value,
      message: _messages.join(" "),
    };
  }
  return {
    isValid: true,
    parsed: value,
  };
}

function validateArray(
  config: ValidationConfig,
  value: unknown[],
  props: Record<string, unknown>,
) {
  const whiteList = config.params?.allowedValues;
  if (whiteList) {
    value.forEach((entry) => {
      if (!whiteList.includes(entry)) {
        return {
          isValid: false,
          parsed: value,
          message: `Disallowed value: ${entry}`,
        };
      }
    });
  }
  return { isValid: true, parsed: value };
}

export const validate = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
) => {
  return VALIDATORS[config.type as ValidationTypes](config, value, props);
};

const WIDGET_TYPE_VALIDATION_ERROR = "This value does not evaluate to type"; // TODO: Lot's of changes in validations.ts file

export const VALIDATORS: Record<ValidationTypes, Validator> = {
  // TODO(abhinav): write rigorous tests for these
  [ValidationTypes.TEXT]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      return {
        isValid: true,
        parsed: config.params?.default || "",
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "string"`,
      };
    }
    if (isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "string"`,
      };
    }
    const isValid = isString(value);
    if (!isValid) {
      try {
        const result = {
          parsed: toString(value),
          isValid: true,
        };
        return result;
      } catch (e) {
        console.error(`Error when parsing ${value} to string`);
        console.error(e);
        return {
          isValid: false,
          parsed: config.params?.default || "",
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "string"`,
        };
      }
    } else {
      return {
        isValid,
        parsed: value,
      };
    }
  },
  // TODO(abhinav): The original validation does not make sense fix this.
  [ValidationTypes.REGEX]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[ValidationTypes.TEXT](
      config,
      value,
      props,
    );

    if (isValid) {
      return {
        isValid: false,
        parsed: new RegExp(parsed),
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "regex"`,
      };
    }

    return { isValid, parsed, message };
  },
  // TODO(ABHINAV): WRITE RIGOROUS TESTS FOR THIS
  [ValidationTypes.NUMBER]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (!Number.isFinite(value) && !isString(value)) {
      return {
        isValid: false,
        parsed: config.params?.default || 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
      };
    }

    if (isString(value)) {
      if (/^\d+\.?\d*$/.test(value)) {
        return {
          isValid: true,
          parsed: parseInt(value, 10),
        };
      } else {
        return {
          isValid: false,
          parsed: config.params?.default || 0,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
        };
      }
    }

    return { isValid: true, parsed: value };
  },
  // TODO(abhinav): Add rigorous tests for the following
  [ValidationTypes.BOOLEAN]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      return {
        isValid: false,
        parsed: config.params?.default || false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
      };
    }
    const isABoolean = value === true || value === false;
    const isStringTrueFalse = value === "true" || value === "false";
    const isValid = isABoolean || isStringTrueFalse;

    let parsed = value;
    if (isStringTrueFalse) parsed = value !== "false";

    if (!isValid) {
      return {
        isValid: false,
        parsed: config.params?.default || parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
      };
    }

    return { isValid, parsed };
  },
  // TODO(abhinav): Add rigorous tests for the following
  [ValidationTypes.OBJECT]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      return {
        isValid: false,
        parsed: config.params?.default || {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    }

    if (isPlainObject(value)) {
      return validatePlainObject(
        config,
        value as Record<string, unknown>,
        props,
      );
    }

    try {
      const result = { parsed: JSON.parse(value as string), isValid: true };
      if (isPlainObject(result.parsed)) {
        return validatePlainObject(config, result.parsed, props);
      }
      return {
        isValid: false,
        parsed: config.params?.default || {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    } catch (e) {
      console.error(`Error when parsing ${value} to object`);
      console.error(e);
      return {
        isValid: false,
        parsed: config.params?.default || {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    }
  },
  [ValidationTypes.ARRAY]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config.params?.default || [],
      message: `${WIDGET_TYPE_VALIDATION_ERROR} Array`,
    };
    if (value === undefined || value === null || isPlainObject(value)) {
      return invalidResponse;
    }

    if (isString(value)) {
      try {
        const _value = JSON.parse(value);
        if (Array.isArray(_value)) return validateArray(config, _value, props);
      } catch (e) {
        return invalidResponse;
      }
    }

    if (Array.isArray(value)) {
      return validateArray(config, value, props);
    }

    return invalidResponse;
  },
  [ValidationTypes.OBJECT_ARRAY]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config.params?.default || [{}],
      message: `${WIDGET_TYPE_VALIDATION_ERROR} Array of objects`,
    };
    if (value === undefined || value === null || !Array.isArray(value)) {
      return invalidResponse;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (!isPlainObject(entry)) {
          return {
            ...invalidResponse,
            message: `Invalid object at index ${index}`,
          };
        }
      });
      return { isValid: true, parsed: value };
    }
    return invalidResponse;
  },
  [ValidationTypes.DATE_ISO_STRING]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config.params?.default || moment().toISOString(true),
      message: `${WIDGET_TYPE_VALIDATION_ERROR}: Full ISO 8601 date string`,
    };
    if (
      value === undefined ||
      value === null ||
      !isString(value) ||
      (isString(value) && !moment(value).isValid())
    ) {
      return invalidResponse;
    }
    if (isString(value) && moment(value).isValid()) {
      if (
        value === moment(value).toISOString() ||
        value === moment(value).toISOString(true)
      ) {
        return {
          isValid: true,
          parsed: value,
        };
      } else {
        return {
          isValid: true,
          parsed: moment(value).toISOString(), // attempting to parse.
        };
      }
    }
    return invalidResponse;
  },
  [ValidationTypes.FUNCTION]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: undefined,
      message: "Failed to validate",
    };
    if (config.params?.fnString && isString(config.params?.fnString)) {
      try {
        return eval(
          `(${config.params.fnString})(${JSON.stringify(
            value,
          )}, ${JSON.stringify(props)})`,
        );
      } catch (e) {
        return invalidResponse;
      }
    }
    return invalidResponse;
  },
};
