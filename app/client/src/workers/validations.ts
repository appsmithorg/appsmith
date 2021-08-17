/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ValidationTypes,
  ValidationResponse,
  Validator,
} from "../constants/WidgetValidation";
import _, {
  get,
  isArray,
  isObject,
  isPlainObject,
  isString,
  startsWith,
  toString,
  uniq,
} from "lodash";
import { WidgetProps } from "../widgets/BaseWidget";

import moment from "moment";
import { ValidationConfig } from "constants/PropertyControlConstants";
import evaluate from "./evaluate";

import getIsSafeURL from "utils/validation/getIsSafeURL";
export const UNDEFINED_VALIDATION = "UNDEFINED_VALIDATION";

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
        const { isValid, message, parsed } = validate(
          entry,
          value[entry.name],
          props,
        );

        if (!isValid) {
          value[entry.name] = parsed;
          _valid = isValid;
          message &&
            _messages.push(
              `Value of key: ${entry.name} is invalid: ${message}`,
            );
        }
      } else if (entry.params?.required) {
        _valid = false;
        _messages.push(`Missing required key: ${entry.name}`);
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
  const children = config.params?.children;
  let _isValid = true;
  const _messages: string[] = [];
  if (children) {
    value.forEach((entry, index) => {
      const validation = validate(children, entry, props);
      if (!validation.isValid) {
        _isValid = false;
        _messages.push(
          `Invalid entry at index: ${index}. ${validation.message}`,
        );
      }
    });
  }
  if (config.params?.unique) {
    if (isArray(config.params?.unique)) {
      for (const param of config.params?.unique) {
        const shouldBeUnique = value.map((entry) =>
          get(entry, param as string, ""),
        );
        if (uniq(shouldBeUnique).length !== value.length) {
          _isValid = false;
          _messages.push(
            `Array entry path:${param} must be unique. Duplicate values found`,
          );
          break;
        }
      }
    } else if (
      uniq(value.map((entry) => JSON.stringify(entry))).length !== value.length
    ) {
      _isValid = false;
      _messages.push(`Array must be unique. Duplicate values found`);
    }
  }

  return {
    isValid: _isValid,
    parsed: _isValid ? value : config.params?.default || [],
    message: _messages.join(" "),
  };
}

export const validate = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
) => {
  const _result = VALIDATORS[config.type as ValidationTypes](
    config,
    value,
    props,
  );
  return _result;
};

export const WIDGET_TYPE_VALIDATION_ERROR =
  "This value does not evaluate to type"; // TODO: Lot's of changes in validations.ts file

export function getExpectedType(config?: ValidationConfig): string | undefined {
  if (!config) return UNDEFINED_VALIDATION; // basic fallback
  switch (config.type) {
    case ValidationTypes.FUNCTION:
      return config.params?.expected?.type || "unknown";
    case ValidationTypes.TEXT:
      let result = "string";
      if (config.params?.allowedValues) {
        const allowed = config.params.allowedValues.join(" | ");
        result = result + ` ( ${allowed} )`;
      }
      if (config.params?.expected?.type) result = config.params?.expected.type;
      return result;
    case ValidationTypes.REGEX:
      return "regExp";
    case ValidationTypes.DATE_ISO_STRING:
      return "ISO 8601 date string";
    case ValidationTypes.BOOLEAN:
      return "boolean";
    case ValidationTypes.NUMBER:
      let type = "number";
      if (config.params?.min) {
        type = `${type} Min: ${config.params?.min}`;
      }
      if (config.params?.max) {
        type = `${type} Max: ${config.params?.max}`;
      }
      if (config.params?.required) {
        type = `${type} Required`;
      }

      return type;
    case ValidationTypes.OBJECT:
      type = "Object";
      if (config.params?.allowedKeys) {
        type = "{";
        config.params?.allowedKeys.forEach((allowedKeyConfig) => {
          const _expected = getExpectedType(allowedKeyConfig);
          type = `${type} "${allowedKeyConfig.name}": "${_expected}",`;
        });
        type = `${type.substring(0, type.length - 1)} }`;
        return type;
      }
      return type;
    case ValidationTypes.ARRAY:
      if (config.params?.allowedValues) {
        const allowed = config.params?.allowedValues.join("' | '");
        return `Array<'${allowed}'>`;
      }
      if (config.params?.children) {
        const children = getExpectedType(config.params.children);
        return `Array<${children}>`;
      }
      return "Array";
    case ValidationTypes.OBJECT_ARRAY:
      return `Array<Object>`;
    case ValidationTypes.IMAGE_URL:
      return `base64 encoded image | data uri | image url`;
    case ValidationTypes.SAFE_URL:
      return "URL";
  }
}

export const VALIDATORS: Record<ValidationTypes, Validator> = {
  [ValidationTypes.TEXT]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      if (config.params && config.params.required) {
        return {
          isValid: false,
          parsed: config.params?.default || "",
          message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        };
      }
      return {
        isValid: true,
        parsed: config.params?.default || "",
      };
    }
    let parsed = value;

    if (isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
      };
    }

    const isValid = isString(parsed);
    if (!isValid) {
      try {
        parsed = toString(parsed);
      } catch (e) {
        return {
          isValid: false,
          parsed: config.params?.default || "",
          message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        };
      }
    }
    if (config.params?.allowedValues) {
      if (!config.params?.allowedValues.includes((parsed as string).trim())) {
        return {
          parsed: config.params?.default || "",
          message: "Value is not allowed",
          isValid: false,
        };
      }
    }

    if (config.params?.regex && !config.params?.regex.test(parsed as string)) {
      return {
        parsed: config.params?.default || "",
        message: `Value does not match expected regex: ${config.params?.regex.source}`,
        isValid: false,
      };
    }

    return {
      isValid: true,
      parsed,
    };
  },
  // TODO(abhinav): The original validation does not make sense fix this.
  [ValidationTypes.REGEX]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const { isValid, message, parsed } = VALIDATORS[ValidationTypes.TEXT](
      config,
      value,
      props,
    );

    if (!isValid) {
      return {
        isValid: false,
        parsed: new RegExp(parsed),
        message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
      };
    }

    return { isValid, parsed, message };
  },
  [ValidationTypes.NUMBER]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      if (config.params?.required) {
        return {
          isValid: false,
          parsed: config.params?.default || 0,
          message: "This value is required",
        };
      }
      return {
        isValid: true,
        parsed: value,
      };
    }
    if (!Number.isFinite(value) && !isString(value)) {
      return {
        isValid: false,
        parsed: config.params?.default || 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
      };
    }

    // check for min and max limits
    let parsed: number = value as number;
    if (isString(value)) {
      if (/^\d+\.?\d*$/.test(value)) {
        parsed = Number(value);
      } else {
        return {
          isValid: false,
          parsed: config.params?.default || 0,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        };
      }
    }

    if (
      config.params?.min !== undefined &&
      Number.isFinite(config.params.min)
    ) {
      if (parsed < Number(config.params.min)) {
        return {
          isValid: false,
          parsed,
          message: `Minimum allowed value: ${config.params.min}`,
        };
      }
    }

    if (
      config.params?.max !== undefined &&
      Number.isFinite(config.params.max)
    ) {
      if (parsed > Number(config.params.max)) {
        return {
          isValid: false,
          parsed,
          message: `Maximum allowed value: ${config.params.max}`,
        };
      }
    }
    if (config.params?.natural && (parsed < 0 || !Number.isInteger(parsed))) {
      return {
        isValid: false,
        parsed,
        message: `Value should be a positive integer`,
      };
    }

    return {
      isValid: true,
      parsed,
    };
  },
  [ValidationTypes.BOOLEAN]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null) {
      if (config.params && config.params.required) {
        return {
          isValid: false,
          parsed: !!config.params?.default,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        };
      }
      return { isValid: true, parsed: config.params?.default || value };
    }
    const isABoolean = value === true || value === false;
    const isStringTrueFalse = value === "true" || value === "false";
    const isValid = isABoolean || isStringTrueFalse;

    let parsed = value;
    if (isStringTrueFalse) parsed = value !== "false";

    if (!isValid) {
      return {
        isValid: false,
        parsed: config.params?.default || false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
      };
    }

    return { isValid, parsed };
  },
  [ValidationTypes.OBJECT]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (
      value === undefined ||
      value === null ||
      (isString(value) && value.trim().length === 0)
    ) {
      if (config.params && config.params.required) {
        return {
          isValid: false,
          parsed: config.params?.default || {},
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(
            config,
          )}`,
        };
      }
      return {
        isValid: true,
        parsed: config.params?.default || value,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
      };
    } catch (e) {
      return {
        isValid: false,
        parsed: config.params?.default || {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
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
      message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
    };
    if (value === undefined || value === null) {
      if (config.params && config.params.required) {
        invalidResponse.message =
          "This property is required for the widget to function correctly";
        return invalidResponse;
      }
      return {
        isValid: true,
        parsed: value,
      };
    }

    if (isString(value)) {
      try {
        const _value = JSON.parse(value);
        if (Array.isArray(_value)) {
          const result = validateArray(config, _value, props);
          return result;
        }
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
      message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
    };
    if (value === undefined || value === null) {
      if (config.params?.required) return invalidResponse;
      return { isValid: true, parsed: value };
    }
    if (!isString(value) && !Array.isArray(value)) {
      return invalidResponse;
    }

    let parsed = value;

    if (isString(value)) {
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        return invalidResponse;
      }
    }

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return invalidResponse;

      for (const [index, parsedEntry] of parsed.entries()) {
        if (!isPlainObject(parsedEntry)) {
          return {
            ...invalidResponse,
            message: `Invalid object at index ${index}`,
          };
        }
      }
      return { isValid: true, parsed };
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
      message: `Value does not match: ${getExpectedType(config)}`,
    };
    if (value === undefined || value === null || !isString(value)) {
      if (!config.params?.required) {
        return {
          isValid: true,
          parsed: value,
        };
      }
      return invalidResponse;
    }
    if (isString(value)) {
      if (!moment(value).isValid()) return invalidResponse;

      if (
        value === moment(value).toISOString() ||
        value === moment(value).toISOString(true)
      ) {
        return {
          isValid: true,
          parsed: value,
        };
      }
      if (moment(value).isValid())
        return { isValid: true, parsed: moment(value).toISOString(true) };
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
        const { result } = evaluate(config.params.fnString, {}, [
          value,
          props,
          _,
          moment,
        ]);
        return result;
      } catch (e) {
        console.error("Validation function error: ", { e });
      }
    }
    return invalidResponse;
  },
  [ValidationTypes.IMAGE_URL]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config.params?.default || "",
      message: `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
    };
    const base64ImageRegex = /^data:image\/.*;base64/;
    const imageUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
    if (
      value === undefined ||
      value === null ||
      (isString(value) && value.trim().length === 0)
    ) {
      if (config.params && config.params.required) return invalidResponse;
      return { isValid: true, parsed: value };
    }
    if (isString(value)) {
      if (imageUrlRegex.test(value.trim())) {
        return { isValid: true, parsed: value.trim() };
      }
      if (base64ImageRegex.test(value)) {
        return {
          isValid: true,
          parsed: value,
        };
      }
      if (btoa(atob(value)) === value) {
        return { isValid: true, parsed: `data:image/png;base64,${value}` };
      }
    }
    return invalidResponse;
  },
  [ValidationTypes.SAFE_URL]: (
    config: ValidationConfig,
    value: unknown,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config?.params?.default || "",
      message: `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
    };

    if (typeof value === "string" && getIsSafeURL(value)) {
      return {
        isValid: true,
        parsed: value,
      };
    } else {
      return invalidResponse;
    }
  },
};
