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
  isString,
  isUndefined,
  toNumber,
  toString,
} from "lodash";
import { WidgetProps } from "../widgets/BaseWidget";
import moment from "moment";

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
  [ValidationTypes.TEXT]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value) || value === null) {
      return {
        isValid: true,
        parsed: value,
        message: "",
      };
    }
    if (isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "text"`,
      };
    }
    let isValid = isString(value);
    if (!isValid) {
      try {
        parsed = toString(value);
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to string`);
        console.error(e);
        return {
          isValid: false,
          parsed: "",
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "text"`,
        };
      }
    }
    return { isValid, parsed };
  },
  [ValidationTypes.REGEX]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[ValidationTypes.TEXT](
      value,
      props,
      dataTree,
    );

    if (isValid) {
      try {
        new RegExp(parsed);
      } catch (e) {
        return {
          isValid: false,
          parsed: parsed,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "regex"`,
        };
      }
    }

    return { isValid, parsed, message };
  },
  [ValidationTypes.NUMBER]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
      };
    }
    let isValid = isNumber(value);
    if (!isValid) {
      try {
        parsed = toNumber(value);
        if (isNaN(parsed)) {
          return {
            isValid: false,
            parsed: 0,
            message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
          };
        }
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to number`);
        console.error(e);
        return {
          isValid: false,
          parsed: 0,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "number"`,
        };
      }
    }
    return { isValid, parsed };
  },
  [ValidationTypes.BOOLEAN]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
      };
    }
    const isABoolean = isBoolean(value);
    const isStringTrueFalse = value === "true" || value === "false";
    const isValid = isABoolean || isStringTrueFalse;
    if (isStringTrueFalse) parsed = value !== "false";
    if (!isValid) {
      return {
        isValid: isValid,
        parsed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "boolean"`,
      };
    }
    return { isValid, parsed };
  },
  [ValidationTypes.OBJECT]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    }
    let isValid = isObject(value);
    if (!isValid) {
      try {
        parsed = JSON.parse(value);
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to object`);
        console.error(e);
        return {
          isValid: false,
          parsed: {},
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
        };
      }
    }
    return { isValid, parsed };
  },
  [ValidationTypes.ARRAY]: (value: any): ValidationResponse => {
    let parsed = value;
    try {
      if (isUndefined(value)) {
        return {
          isValid: false,
          parsed: [],
          transformed: undefined,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "Array"`,
        };
      }
      if (isString(value)) {
        parsed = JSON.parse(parsed as string);
      }

      if (!Array.isArray(parsed)) {
        return {
          isValid: false,
          parsed: [],
          transformed: parsed,
          message: `${WIDGET_TYPE_VALIDATION_ERROR} "Array"`,
        };
      }

      return { isValid: true, parsed, transformed: parsed };
    } catch (e) {
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR} "Array"`,
      };
    }
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
  [ValidationTypes.SELECTED_TAB]: (
    value: any,
    props: WidgetProps,
  ): ValidationResponse => {
    const tabs: any = props.tabsObj
      ? Object.values(props.tabsObj)
      : props.tabs || [];
    const tabNames = tabs.map((i: { label: string; id: string }) => i.label);
    const isValidTabName = tabNames.includes(value);
    return {
      isValid: isValidTabName,
      parsed: isValidTabName ? value : "",
      message: isValidTabName ? "" : `Tab name provided does not exist.`,
    };
  },
  [ValidationTypes.DEFAULT_OPTION_VALUE]: (
    value: string | string[],
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    let values = value;

    if (props) {
      if (props.selectionType === "SINGLE_SELECT") {
        return VALIDATORS[ValidationTypes.TEXT](value, props, dataTree);
      } else if (props.selectionType === "MULTI_SELECT") {
        if (typeof value === "string") {
          try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) {
              throw new Error();
            }
          } catch {
            values = value.length ? value.split(",") : [];
            if (values.length > 0) {
              values = values.map((value) => value.trim());
            }
          }
        }
      }
    }

    if (Array.isArray(values)) {
      values = _.uniq(values);
    }

    return {
      isValid: true,
      parsed: values,
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
