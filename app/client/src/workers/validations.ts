import {
  ISO_DATE_FORMAT,
  ValidationTypes,
  ValidationResponse,
  Validator,
} from "../constants/WidgetValidation";
import { DataTree } from "../entities/DataTree/dataTreeFactory";
import _, {
  isBoolean,
  isNil,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
  toNumber,
  toString,
} from "lodash";
import { WidgetProps } from "../widgets/BaseWidget";
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

function validateArray(config: ValidationConfig, value: unknown[], props) {
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

const validate = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
) => {
  // let validator;
  // switch (config.type) {
  //   case ValidationTypes.TEXT:
  //     validator = VALIDATORS[ValidationTypes.TEXT];
  //     break;
  //   case ValidationTypes.BOOLEAN:
  //     validator = VALIDATORS[ValidationTypes.BOOLEAN];
  //     break;
  //   case ValidationTypes.NUMBER:
  //     validator = VALIDATORS[ValidationTypes.NUMBER];
  //     break;
  //   case ValidationTypes.REGEX:
  //     validator = VALIDATORS[ValidationTypes.REGEX];
  //     break;
  //   case ValidationTypes.OBJECT:
  //     validator = VALIDATORS[ValidationTypes.OBJECT];
  //     break;
  //   case ValidationTypes.ARRAY:
  //     validator = VALIDATORS[ValidationTypes.ARRAY];
  //     break;
  //   case ValidationTypes.OBJECT_ARRAY:
  //     validator = VALIDATORS[ValidationTypes.OBJECT_ARRAY];
  // }
  return VALIDATORS[config.type](config, value, props);
};

export function validateDateString(
  dateString: string,
  dateFormat: string,
  version: number,
) {
  let isValid = true;
  if (version === 2) {
    try {
      const d = moment(dateString);
      isValid =
        d.toISOString(true) === dateString || d.toISOString() === dateString;
      if (!isValid) {
        const parsedDate = moment(dateString);
        isValid = parsedDate.isValid();
      }
    } catch (e) {
      isValid = false;
    }
  } else {
    const parsedDate = moment(dateString, dateFormat);
    isValid = parsedDate.isValid();
  }
  return isValid;
}

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
    value: any,
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
      return validatePlainObject(config, value, props);
    }

    try {
      const result = { parsed: JSON.parse(value), isValid: true };
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
    value: any,
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
  [ValidationTypes.DATE_ISO_STRING]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const dateFormat =
      props.version === 2
        ? ISO_DATE_FORMAT
        : props.dateFormat || ISO_DATE_FORMAT;
    if (dateString === null) {
      return {
        isValid: true,
        parsed: "",
        message: "",
      };
    }
    if (dateString === undefined) {
      return {
        isValid: false,
        parsed: "",
        message:
          `${WIDGET_TYPE_VALIDATION_ERROR}: Date ` + props.dateFormat
            ? props.dateFormat
            : "",
      };
    }
    const isValid = validateDateString(dateString, dateFormat, props.version);
    let parsedDate = dateString;

    try {
      if (isValid && props.version === 2) {
        parsedDate = moment(dateString).toISOString(true);
      }
    } catch (e) {
      console.error("Could not parse date", parsedDate, e);
    }

    if (!isValid) {
      return {
        isValid: isValid,
        parsed: "",
        message: `Value does not match ISO 8601 standard date string`,
      };
    }
    return {
      isValid,
      parsed: parsedDate,
      message: isValid
        ? ""
        : `Value does not match ISO 8601 standard date string`,
    };
  },
  [ValidationTypes.DEFAULT_DATE]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const dateFormat =
      props.version === 2
        ? ISO_DATE_FORMAT
        : props.dateFormat || ISO_DATE_FORMAT;
    if (dateString === null) {
      return {
        isValid: true,
        parsed: "",
        message: "",
      };
    }
    if (dateString === undefined) {
      return {
        isValid: false,
        parsed: "",
        message:
          `${WIDGET_TYPE_VALIDATION_ERROR}: Date ` + dateFormat
            ? dateFormat
            : "",
      };
    }

    const isValid = validateDateString(dateString, dateFormat, props.version);
    let parsedDate = dateString;

    try {
      if (isValid && props.version === 2) {
        parsedDate = moment(dateString).toISOString(true);
      }
    } catch (e) {
      console.error("Could not parse date", parsedDate, e);
    }
    if (!isValid) {
      return {
        isValid: isValid,
        parsed: "",
        message: `Value does not match ISO 8601 standard date string`,
      };
    }
    return {
      isValid: isValid,
      parsed: parsedDate,
      message: "",
    };
  },
  [ValidationTypes.ACTION_SELECTOR]: (value: any): ValidationResponse => {
    if (Array.isArray(value) && value.length) {
      return {
        isValid: true,
        parsed: undefined,
        transformed: "Function Call",
      };
    }
    return {
      isValid: false,
      parsed: undefined,
      transformed: "undefined",
      message: "Not a function call",
    };
  },
  [ValidationTypes.ARRAY_ACTION_SELECTOR]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[ValidationTypes.ARRAY](
      value,
      props,
      dataTree,
    );
    let isValidFinal = isValid;
    let finalParsed = parsed.slice();
    if (isValid) {
      finalParsed = parsed.map((value: any) => {
        const { isValid, message } = VALIDATORS[
          ValidationTypes.ACTION_SELECTOR
        ](value.dynamicTrigger, props, dataTree);

        isValidFinal = isValidFinal && isValid;
        return {
          ...value,
          message: message,
          isValid: isValid,
        };
      });
    }

    return {
      isValid: isValidFinal,
      parsed: finalParsed,
      message: message,
    };
  },
  [ValidationTypes.DEFAULT_SELECTED_ROW]: (
    value: string | string[],
    props: WidgetProps,
  ) => {
    if (props) {
      if (props.multiRowSelection) {
        if (props && !props.multiRowSelection)
          return { isValid: true, parsed: undefined };

        if (isString(value)) {
          const trimmed = value.trim();
          try {
            const parsedArray = JSON.parse(trimmed);
            if (Array.isArray(parsedArray)) {
              const sanitized = parsedArray.filter((entry) => {
                return (
                  Number.isInteger(parseInt(entry, 10)) &&
                  parseInt(entry, 10) > -1
                );
              });
              return { isValid: true, parsed: sanitized };
            } else {
              throw Error("Not a stringified array");
            }
          } catch (e) {
            // If cannot be parsed as an array
            const arrayEntries = trimmed.split(",");
            const result: number[] = [];
            arrayEntries.forEach((entry) => {
              if (
                Number.isInteger(parseInt(entry, 10)) &&
                parseInt(entry, 10) > -1
              ) {
                if (!isNil(entry)) result.push(parseInt(entry, 10));
              }
            });
            return { isValid: true, parsed: result };
          }
        }
        if (Array.isArray(value)) {
          const sanitized = value.filter((entry) => {
            return (
              Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1
            );
          });
          return { isValid: true, parsed: sanitized };
        }
        if (Number.isInteger(value) && value > -1) {
          return { isValid: true, parsed: [value] };
        }
        return {
          isValid: false,
          parsed: [],
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: number[]`,
        };
      } else {
        try {
          const _value: string = value as string;
          if (
            Number.isInteger(parseInt(_value, 10)) &&
            parseInt(_value, 10) > -1
          )
            return { isValid: true, parsed: parseInt(_value, 10) };

          return {
            isValid: true,
            parsed: -1,
          };
        } catch (e) {
          return {
            isValid: true,
            parsed: -1,
          };
        }
      }
    }
    return {
      isValid: true,
      parsed: value,
    };
  },
};
