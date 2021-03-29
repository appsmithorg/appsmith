import {
  ISO_DATE_FORMAT,
  VALIDATION_TYPES,
  ValidationResponse,
  ValidationType,
  Validator,
} from "../constants/WidgetValidation";
import { DataTree } from "../entities/DataTree/dataTreeFactory";
import _, {
  every,
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

const WIDGET_TYPE_VALIDATION_ERROR = "Value does not match type"; // TODO: Lot's of changes in validations.ts file

export const VALIDATORS: Record<ValidationType, Validator> = {
  [VALIDATION_TYPES.TEXT]: (value: any): ValidationResponse => {
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: text`,
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
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: text`,
        };
      }
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.REGEX]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[VALIDATION_TYPES.TEXT](
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
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: regex`,
        };
      }
    }

    return { isValid, parsed, message };
  },
  [VALIDATION_TYPES.NUMBER]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
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
            message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
          };
        }
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to number`);
        console.error(e);
        return {
          isValid: false,
          parsed: 0,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
        };
      }
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.BOOLEAN]: (value: any): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: boolean`,
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
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: boolean`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.OBJECT]: (value: any): ValidationResponse => {
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
  [VALIDATION_TYPES.ARRAY]: (value: any): ValidationResponse => {
    let parsed = value;
    try {
      if (isUndefined(value)) {
        return {
          isValid: false,
          parsed: [],
          transformed: undefined,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
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
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
        };
      }
      return { isValid: true, parsed, transformed: parsed };
    } catch (e) {
      console.error(e);
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
      };
    }
  },
  [VALIDATION_TYPES.TABS_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Tabs Data`,
      };
    } else if (
      !every(
        parsed,
        (datum: {
          id: string;
          label: string;
          widgetId: string;
          isVisible?: boolean;
        }) =>
          isObject(datum) &&
          !isUndefined(datum.id) &&
          !isUndefined(datum.label) &&
          !isUndefined(datum.widgetId),
      )
    ) {
      return {
        isValid: false,
        parsed: [],
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Tabs Data`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.TABLE_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, transformed, parsed } = VALIDATORS.ARRAY(
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed: [],
        transformed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: [{ "Col1" : "val1", "Col2" : "val2" }]`,
      };
    }
    const isValidTableData = every(parsed, (datum) => {
      return (
        isPlainObject(datum) &&
        Object.keys(datum).filter((key) => isString(key) && key.length === 0)
          .length === 0
      );
    });
    if (!isValidTableData) {
      return {
        isValid: false,
        parsed: [],
        transformed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: [{ "Col1" : "val1", "Col2" : "val2" }]`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.CHART_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Chart Data`,
      };
    }
    let validationMessage = "";
    let index = 0;
    const parsedChartData = [];
    let isValidChart = true;

    for (const seriesData of parsed) {
      let isValidSeries = false;
      try {
        const validatedResponse: {
          isValid: boolean;
          parsed: Array<unknown>;
          message?: string;
        } = VALIDATORS[VALIDATION_TYPES.ARRAY](
          seriesData.data,
          props,
          dataTree,
        );
        if (validatedResponse.isValid) {
          isValidSeries = every(
            validatedResponse.parsed,
            (chartPoint: { x: string; y: any }) => {
              return (
                isObject(chartPoint) &&
                isString(chartPoint.x) &&
                !isUndefined(chartPoint.y)
              );
            },
          );
        }
        if (!isValidSeries) {
          isValidChart = false;
          parsedChartData.push({
            ...seriesData,
            data: [],
          });
          validationMessage = `${index}##${WIDGET_TYPE_VALIDATION_ERROR}: [{ "x": "val", "y": "val" }]`;
        } else {
          parsedChartData.push({
            ...seriesData,
            data: validatedResponse.parsed,
          });
        }
      } catch (e) {
        console.error(e);
      }
      index++;
    }
    if (!isValidChart) {
      return {
        isValid: false,
        parsed: parsedChartData,
        transformed: parsed,
        message: validationMessage,
      };
    }
    return { isValid, parsed: parsedChartData, transformed: parsedChartData };
  },
  [VALIDATION_TYPES.CUSTOM_FUSION_CHARTS_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.OBJECT](
      value,
      props,
      dataTree,
    );
    if (props.chartName && parsed.dataSource && parsed.dataSource.chart) {
      parsed.dataSource.chart.caption = props.chartName;
    }
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: {type: string, dataSource: { chart: object, data: Array<{label: string, value: number}>}}`,
      };
    }
    if (parsed.renderAt) {
      delete parsed.renderAt;
    }
    if (!parsed.dataSource || !parsed.type) {
      return {
        isValid: false,
        parsed: parsed,
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: {type: string, dataSource: { chart: object, data: Array<{label: string, value: number}>}}`,
      };
    }
    return { isValid, parsed, transformed: parsed };
  },
  [VALIDATION_TYPES.MARKERS]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Marker Data`,
      };
    } else if (
      !every(
        parsed,
        (datum) => VALIDATORS[VALIDATION_TYPES.LAT_LONG](datum, props).isValid,
      )
    ) {
      return {
        isValid: false,
        parsed: [],
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Marker Data`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.OPTIONS_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Options Data`,
      };
    }
    try {
      const isValidOption = (option: { label: any; value: any }) =>
        _.isObject(option) &&
        _.isString(option.label) &&
        !_.isEmpty(option.label);

      const hasOptions = every(parsed, isValidOption);
      const validOptions = parsed.filter(isValidOption);
      const uniqValidOptions = _.uniqBy(validOptions, "value");

      if (!hasOptions || uniqValidOptions.length !== validOptions.length) {
        return {
          isValid: false,
          parsed: uniqValidOptions,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Options Data`,
        };
      }
      return { isValid, parsed };
    } catch (e) {
      console.error(e);
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
      };
    }
  },
  [VALIDATION_TYPES.DATE_ISO_STRING]: (
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
      message: isValid ? "" : `${WIDGET_TYPE_VALIDATION_ERROR}: Date`,
    };
  },
  [VALIDATION_TYPES.DEFAULT_DATE]: (
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
  [VALIDATION_TYPES.MIN_DATE]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const dateFormat =
      props.version === 2
        ? ISO_DATE_FORMAT
        : props.dateFormat || ISO_DATE_FORMAT;
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
    const parsedMinDate = moment(dateString, dateFormat);
    let isValid = validateDateString(dateString, dateFormat, props.version);
    if (!props.defaultDate) {
      return {
        isValid: isValid,
        parsed: dateString,
        message: "",
      };
    }
    const parsedDefaultDate = moment(props.defaultDate, dateFormat);

    if (
      isValid &&
      parsedDefaultDate.isValid() &&
      parsedDefaultDate.isBefore(parsedMinDate)
    ) {
      isValid = false;
    }
    if (!isValid) {
      return {
        isValid: isValid,
        parsed: "",
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Date R`,
      };
    }
    return {
      isValid: isValid,
      parsed: dateString,
      message: "",
    };
  },
  [VALIDATION_TYPES.MAX_DATE]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const dateFormat =
      props.version === 2
        ? ISO_DATE_FORMAT
        : props.dateFormat || ISO_DATE_FORMAT;
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
    const parsedMaxDate = moment(dateString, dateFormat);
    let isValid = validateDateString(dateString, dateFormat, props.version);
    if (!props.defaultDate) {
      return {
        isValid: isValid,
        parsed: dateString,
        message: "",
      };
    }
    const parsedDefaultDate = moment(props.defaultDate, dateFormat);

    if (
      isValid &&
      parsedDefaultDate.isValid() &&
      parsedDefaultDate.isAfter(parsedMaxDate)
    ) {
      isValid = false;
    }
    if (!isValid) {
      return {
        isValid: isValid,
        parsed: "",
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Date R`,
      };
    }
    return {
      isValid: isValid,
      parsed: dateString,
      message: "",
    };
  },
  [VALIDATION_TYPES.ACTION_SELECTOR]: (value: any): ValidationResponse => {
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
  [VALIDATION_TYPES.ARRAY_ACTION_SELECTOR]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    let isValidFinal = isValid;
    let finalParsed = parsed.slice();
    if (isValid) {
      finalParsed = parsed.map((value: any) => {
        const { isValid, message } = VALIDATORS[
          VALIDATION_TYPES.ACTION_SELECTOR
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
  [VALIDATION_TYPES.SELECTED_TAB]: (
    value: any,
    props: WidgetProps,
  ): ValidationResponse => {
    const tabs =
      props.tabs && isString(props.tabs)
        ? JSON.parse(props.tabs)
        : props.tabs && Array.isArray(props.tabs)
        ? props.tabs
        : [];
    const tabNames = tabs.map((i: { label: string; id: string }) => i.label);
    const isValidTabName = tabNames.includes(value);
    return {
      isValid: isValidTabName,
      parsed: value,
      message: isValidTabName
        ? ""
        : `${WIDGET_TYPE_VALIDATION_ERROR}: Invalid tab name.`,
    };
  },
  [VALIDATION_TYPES.DEFAULT_OPTION_VALUE]: (
    value: string | string[],
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    let values = value;

    if (props) {
      if (props.selectionType === "SINGLE_SELECT") {
        return VALIDATORS[VALIDATION_TYPES.TEXT](value, props, dataTree);
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
  [VALIDATION_TYPES.DEFAULT_SELECTED_ROW]: (
    value: string | string[],
    props: WidgetProps,
  ) => {
    if (props) {
      if (props.multiRowSelection) {
        return VALIDATORS[VALIDATION_TYPES.ROW_INDICES](value, props);
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
  [VALIDATION_TYPES.COLUMN_PROPERTIES_ARRAY]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        transformed: parsed,
        message: "",
      };
    }
    const isValidProperty = (data: any) =>
      isString(data) || isNumber(data) || isBoolean(data);
    const isValidColumns = every(parsed, (datum: any) => {
      const validatedResponse: {
        isValid: boolean;
        parsed: Record<string, unknown>;
        message?: string;
      } = VALIDATORS[VALIDATION_TYPES.OBJECT](datum, props, dataTree);
      const isValidColumn = validatedResponse.isValid;
      if (isValidColumn) {
        for (const key in validatedResponse.parsed) {
          const columnProperty = validatedResponse.parsed[key];
          let isValidColumnProperty = true;
          if (Array.isArray(columnProperty)) {
            isValidColumnProperty = every(columnProperty, (data: any) => {
              return isValidProperty(data);
            });
          } else if (!isObject(columnProperty)) {
            isValidColumnProperty = isValidProperty(columnProperty);
          }
          if (!isValidColumnProperty) {
            validatedResponse.parsed[key] = "";
          }
        }
      }
      return isValidColumn;
    });
    if (!isValidColumns) {
      return {
        isValid: isValidColumns,
        parsed: [],
        transformed: parsed,
        message: "",
      };
    }
    return { isValid, parsed, transformed: parsed };
  },
  [VALIDATION_TYPES.LAT_LONG]: (unparsedValue: {
    lat?: number;
    long?: number;
    [x: string]: any;
  }): ValidationResponse => {
    let value = unparsedValue;
    const invalidResponse = {
      isValid: false,
      parsed: undefined,
      message: `${WIDGET_TYPE_VALIDATION_ERROR}: { lat: number, long: number }`,
    };

    if (isString(unparsedValue)) {
      try {
        value = JSON.parse(unparsedValue);
      } catch (e) {
        console.error(`Error when parsing string as object`);
      }
    }

    const { lat, long } = value || {};
    const validLat = typeof lat === "number" && lat <= 90 && lat >= -90;
    const validLong = typeof long === "number" && long <= 180 && long >= -180;

    if (!validLat || !validLong) {
      return invalidResponse;
    }

    return {
      isValid: true,
      parsed: value,
    };
  },
  // If we keep adding these here there will be a huge unmaintainable list
  // TODO(abhinav: WIDGET DEV API):
  // - Compile validators from the widgets during widget registration
  // - Use the compiled list in the web worker startup
  // - Remove widget specific validations from this file
  // - Design consideration: If widgets can be dynamically imported, how will this work?
  [VALIDATION_TYPES.TABLE_PAGE_NO]: (value: any): ValidationResponse => {
    if (!value || !Number.isInteger(value) || value < 0)
      return { isValid: false, parsed: 1, message: "" };
    return { isValid: true, parsed: value };
  },
  [VALIDATION_TYPES.ROW_INDICES]: (
    value: any,
    props: any,
  ): ValidationResponse => {
    if (props && !props.multiRowSelection)
      return { isValid: true, parsed: undefined };

    if (isString(value)) {
      const trimmed = value.trim();
      try {
        const parsedArray = JSON.parse(trimmed);
        if (Array.isArray(parsedArray)) {
          const sanitized = parsedArray.filter((entry) => {
            return (
              Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1
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
  },
};
