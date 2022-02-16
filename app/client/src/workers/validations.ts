/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ValidationTypes,
  ValidationResponse,
  Validator,
} from "../constants/WidgetValidation";
import _, {
  compact,
  get,
  isArray,
  isObject,
  isPlainObject,
  isRegExp,
  isString,
  toString,
  uniq,
  __,
} from "lodash";

import moment from "moment";
import { ValidationConfig } from "constants/PropertyControlConstants";
import evaluate from "./evaluate";

import getIsSafeURL from "utils/validation/getIsSafeURL";
import * as log from "loglevel";
import { findDuplicateIndex } from "./helpers";
export const UNDEFINED_VALIDATION = "UNDEFINED_VALIDATION";
export const VALIDATION_ERROR_COUNT_THRESHOLD = 10;

const flat = (array: Record<string, any>[], uniqueParam: string) => {
  let result: { value: string }[] = [];
  array.forEach((a) => {
    result.push({ value: a[uniqueParam] });
    if (Array.isArray(a.children)) {
      result = result.concat(flat(a.children, uniqueParam));
    }
  });
  return result;
};

function getPropertyEntry(
  obj: Record<string, unknown>,
  name: string,
  ignoreCase = false,
) {
  if (!ignoreCase) {
    return name;
  } else {
    const keys = Object.getOwnPropertyNames(obj);
    return keys.find((key) => key.toLowerCase() === name.toLowerCase()) || name;
  }
}

function validatePlainObject(
  config: ValidationConfig,
  value: Record<string, unknown>,
  props: Record<string, unknown>,
) {
  if (config.params?.allowedKeys) {
    let _valid = true;
    const _messages: string[] = [];
    config.params.allowedKeys.forEach((entry) => {
      const ignoreCase = !!entry.params?.ignoreCase;
      const entryName = getPropertyEntry(value, entry.name, ignoreCase);

      if (value.hasOwnProperty(entryName)) {
        const { isValid, messages, parsed } = validate(
          entry,
          value[entryName],
          props,
        );
        if (!isValid) {
          value[entryName] = parsed;
          _valid = isValid;
          messages &&
            messages.map((message) => {
              _messages.push(
                `Value of key: ${entryName} is invalid: ${message}`,
              );
            });
        }
      } else if (entry.params?.required || entry.params?.requiredKey) {
        _valid = false;
        _messages.push(`Missing required key: ${entryName}`);
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
      messages: _messages,
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
  let _isValid = true; // Let's first assume that this is valid
  const _messages: string[] = []; // Initialise messages array

  // Values allowed in the array, converted into a set of unique values
  // or an empty set
  const allowedValues = new Set(config.params?.allowedValues || []);

  // Keys whose values are supposed to be unique across all values in all objects in the array
  let uniqueKeys: Array<string> = [];
  const allowedKeyConfigs = config.params?.children?.params?.allowedKeys;
  if (
    config.params?.children?.type === ValidationTypes.OBJECT &&
    Array.isArray(allowedKeyConfigs) &&
    allowedKeyConfigs.length
  ) {
    uniqueKeys = compact(
      allowedKeyConfigs.map((allowedKeyConfig) => {
        // TODO(abhinav): This is concerning, we now have two ways,
        // in which we can define unique keys in an array of objects
        // We need to disable one option.

        // If this key is supposed to be unique across all objects in the value array
        // We include it in the uniqueKeys list
        if (allowedKeyConfig.params?.unique) return allowedKeyConfig.name;
      }),
    );
  }

  // Concatenate unique keys from config.params?.unique
  uniqueKeys = Array.isArray(config.params?.unique)
    ? uniqueKeys.concat(config.params?.unique as Array<string>)
    : uniqueKeys;

  // Validation configuration for children
  const childrenValidationConfig = config.params?.children;

  // Should we validate against disallowed values in the value array?
  const shouldVerifyAllowedValues = !!allowedValues.size; // allowedValues is a set

  // Do we have validation config for array children?
  const shouldValidateChildren = !!childrenValidationConfig;

  // Should array values be unique? This should applies only to primitive values in array children
  // If we have to validate children with their own validation config, this should be false (Needs verification)
  // If this option is true, shouldArrayValuesHaveUniqueValuesForKeys will become false
  const shouldArrayHaveUniqueEntries = config.params?.unique === true;

  // Should we validate for unique values for properties in the array entries?
  const shouldArrayValuesHaveUniqueValuesForKeys =
    !!uniqueKeys.length && !shouldArrayHaveUniqueEntries;

  // Verify if all values are unique
  if (shouldArrayHaveUniqueEntries) {
    // Find the index of a duplicate value in array
    const duplicateIndex = findDuplicateIndex(value);
    if (duplicateIndex !== -1) {
      // Bail out early
      // Because, we don't want to re-iterate, if this validation fails
      return {
        isValid: false,
        parsed: config.params?.default || [],
        messages: [
          `Array must be unique. Duplicate values found at index: ${duplicateIndex}`,
        ],
      };
    }
  }

  if (shouldArrayValuesHaveUniqueValuesForKeys) {
    // Loop
    // Get only unique entries from the value array
    const uniqueEntries = _.uniqWith(
      value as Array<Record<string, unknown>>,
      (a: Record<string, unknown>, b: Record<string, unknown>) => {
        // If any of the keys are the same, we fail the uniqueness test
        return uniqueKeys.some((key) => a[key] === b[key]);
      },
    );

    if (uniqueEntries.length !== value.length) {
      // Bail out early
      // Because, we don't want to re-iterate, if this validation fails
      return {
        isValid: false,
        parsed: config.params?.default || [],
        messages: [
          `Duplicate values found for the following properties, in the array entries, that must be unique -- ${uniqueKeys.join(
            ",",
          )}.`,
        ],
      };
    }
  }

  // Loop
  value.every((entry, index) => {
    // Validate for allowed values
    if (shouldVerifyAllowedValues && !allowedValues.has(entry)) {
      _messages.push(`Value is not allowed in this array: ${entry}`);
      _isValid = false;
    }

    // validate using validation config
    if (shouldValidateChildren && childrenValidationConfig) {
      // Validate this entry
      const childValidationResult = validate(
        childrenValidationConfig,
        entry,
        props,
      );

      // If invalid, append to messages
      if (!childValidationResult.isValid) {
        _isValid = false;
        childValidationResult.messages?.forEach((message) =>
          _messages.push(`Invalid entry at index: ${index}. ${message}`),
        );
      }
    }

    // Bail out, if the error count threshold has been overcome
    // This way, debugger will not have to render too many errors
    if (_messages.length >= VALIDATION_ERROR_COUNT_THRESHOLD && !_isValid) {
      return false;
    }
    return true;
  });

  return {
    isValid: _isValid,
    parsed: _isValid ? value : config.params?.default || [],
    messages: _messages,
  };
}
//TODO: parameter props may not be in use
export const validate = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
): ValidationResponse => {
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
      if (config.params?.regex) {
        result = config.params?.regex.source;
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
    case ValidationTypes.NESTED_OBJECT_ARRAY:
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
    if (value === undefined || value === null || value === "") {
      if (config.params && config.params.required) {
        return {
          isValid: false,
          parsed: config.params?.default || "",
          messages: [
            `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
          ],
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
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        ],
      };
    }

    const isValid = isString(parsed);
    const stringValidationError = {
      isValid: false,
      parsed: config.params?.default || "",
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`],
    };
    if (!isValid) {
      try {
        if (!config.params?.strict) parsed = toString(parsed);
        else return stringValidationError;
      } catch (e) {
        return stringValidationError;
      }
    }
    if (config.params?.allowedValues) {
      if (!config.params?.allowedValues.includes((parsed as string).trim())) {
        return {
          parsed: config.params?.default || "",
          messages: [`Disallowed value: ${parsed}`],
          isValid: false,
        };
      }
    }

    if (
      config.params?.regex &&
      isRegExp(config.params?.regex) &&
      !config.params?.regex.test(parsed as string)
    ) {
      return {
        parsed: config.params?.default || "",
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        ],
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
    const { isValid, messages, parsed } = VALIDATORS[ValidationTypes.TEXT](
      config,
      value,
      props,
    );

    if (!isValid) {
      return {
        isValid: false,
        parsed: new RegExp(parsed),
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        ],
      };
    }

    return { isValid, parsed, messages };
  },
  [ValidationTypes.NUMBER]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (value === undefined || value === null || value === "") {
      if (config.params?.required) {
        return {
          isValid: false,
          parsed: config.params?.default || 0,
          messages: ["This value is required"],
        };
      }

      if (value === "") {
        return {
          isValid: true,
          parsed: config.params?.default || 0,
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
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        ],
      };
    }

    // check for min and max limits
    let parsed: number = value as number;
    if (isString(value)) {
      if (/^-?\d+\.?\d*$/.test(value)) {
        parsed = Number(value);
      } else {
        return {
          isValid: false,
          parsed: value || config.params?.default || 0,
          messages: [
            `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
          ],
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
          parsed: parsed || config.params.min || 0,
          messages: [`Minimum allowed value: ${config.params.min}`],
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
          parsed: config.params.max || parsed || 0,
          messages: [`Maximum allowed value: ${config.params.max}`],
        };
      }
    }
    if (config.params?.natural && (parsed < 0 || !Number.isInteger(parsed))) {
      return {
        isValid: false,
        parsed: config.params.default || parsed || 0,
        messages: [`Value should be a positive integer`],
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
    if (value === undefined || value === null || value === "") {
      if (config.params && config.params.required) {
        return {
          isValid: false,
          parsed: !!config.params?.default,
          messages: [
            `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
          ],
        };
      }

      if (value === "") {
        return {
          isValid: true,
          parsed: config.params?.default || false,
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
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
        ],
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
          messages: [
            `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
          ],
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
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
        ],
      };
    } catch (e) {
      return {
        isValid: false,
        parsed: config.params?.default || {},
        messages: [
          `${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`,
        ],
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
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`],
    };
    if (value === undefined || value === null || value === "") {
      if (
        config.params &&
        config.params.required &&
        !isArray(config.params.default)
      ) {
        invalidResponse.messages = [
          "This property is required for the widget to function correctly",
        ];
        return invalidResponse;
      }
      if (value === "") {
        return {
          isValid: true,
          parsed: config.params?.default || [],
        };
      }
      if (config.params && isArray(config.params.default)) {
        return {
          isValid: true,
          parsed: config.params?.default,
        };
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
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`],
    };
    if (value === undefined || value === null || value === "") {
      if (config.params?.required) return invalidResponse;

      if (value === "") {
        return {
          isValid: true,
          parsed: config.params?.default || [{}],
        };
      }

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
      if (parsed.length === 0) {
        if (config.params?.required) {
          return invalidResponse;
        } else {
          return {
            isValid: true,
            parsed: config.params?.default || [{}],
          };
        }
      }

      for (const [index, parsedEntry] of parsed.entries()) {
        if (!isPlainObject(parsedEntry)) {
          return {
            ...invalidResponse,
            messages: [`Invalid object at index ${index}`],
          };
        }
      }
      return { isValid: true, parsed };
    }
    return invalidResponse;
  },

  [ValidationTypes.NESTED_OBJECT_ARRAY]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    let response: ValidationResponse = {
      isValid: false,
      parsed: config.params?.default || [],
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`],
    };
    response = VALIDATORS.ARRAY(config, value, props);

    if (!response.isValid) {
      return response;
    }
    // Check if all values and children values are unique
    if (config.params?.unique && response.parsed.length) {
      if (isArray(config.params?.unique)) {
        for (const param of config.params?.unique) {
          const flattenedArray = flat(response.parsed, param);
          const shouldBeUnique = flattenedArray.map((entry) =>
            get(entry, param, ""),
          );
          if (uniq(shouldBeUnique).length !== flattenedArray.length) {
            response = {
              ...response,
              isValid: false,
              messages: [
                `path:${param} must be unique. Duplicate values found`,
              ],
            };
          }
        }
      }
    }
    return response;
  },
  [ValidationTypes.DATE_ISO_STRING]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    const invalidResponse = {
      isValid: false,
      parsed: config.params?.default,
      messages: [`Value does not match: ${getExpectedType(config)}`],
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
      if (value === "" && !config.params?.required) {
        return {
          isValid: true,
          parsed: config.params?.default,
        };
      } else if (value === "" && config.params?.required) {
        return invalidResponse;
      }

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
      messages: ["Failed to validate"],
    };
    if (config.params?.fnString && isString(config.params?.fnString)) {
      try {
        const { result } = evaluate(
          config.params.fnString,
          {},
          {},
          false,
          undefined,
          [value, props, _, moment],
        );
        return result;
      } catch (e) {
        log.error("Validation function error: ", { e });
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
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`],
    };
    const base64Regex = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
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
      if (base64Regex.test(value) && btoa(atob(value)) === value) {
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
      messages: [`${WIDGET_TYPE_VALIDATION_ERROR}: ${getExpectedType(config)}`],
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

  /**
   *
   * TABLE_PROPERTY can be used in scenarios where we wanted to validate
   * using ValidationTypes.ARRAY or ValidationTypes.* at the same time.
   * This is needed in case of properties inside Table widget where we use COMPUTE_VALUE
   * For more info: https://github.com/appsmithorg/appsmith/pull/9396
   *
   */
  [ValidationTypes.TABLE_PROPERTY]: (
    config: ValidationConfig,
    value: unknown,
    props: Record<string, unknown>,
  ): ValidationResponse => {
    if (!config.params?.type)
      return {
        isValid: false,
        parsed: undefined,
        messages: ["Invalid validation"],
      };

    // Validate when JS mode is disabled
    const result = VALIDATORS[config.params.type as ValidationTypes](
      config.params as ValidationConfig,
      value,
      props,
    );
    if (result.isValid) return result;

    // Validate when JS mode is enabled
    const resultValue = [];
    if (_.isArray(value)) {
      for (const item of value) {
        const result = VALIDATORS[config.params.type](
          config.params as ValidationConfig,
          item,
          props,
        );
        if (!result.isValid) return result;
        resultValue.push(result.parsed);
      }
    } else {
      return {
        isValid: false,
        parsed: config.params?.params?.default,
        messages: result.messages,
      };
    }

    return {
      isValid: true,
      parsed: resultValue,
    };
  },
};
