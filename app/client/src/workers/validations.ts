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
  isNumber,
  isObject,
  isString,
  isUndefined,
  toNumber,
  toString,
} from "lodash";
import { WidgetProps } from "../widgets/BaseWidget";
import { WIDGET_TYPE_VALIDATION_ERROR } from "../constants/messages";
import moment from "moment";

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
    } else if (!every(parsed, (datum) => isObject(datum))) {
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
        isObject(datum) &&
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
    const isValidChartData = every(
      parsed,
      (datum: { name: string; data: any }) => {
        const validatedResponse: {
          isValid: boolean;
          parsed: Array<unknown>;
          message?: string;
        } = VALIDATORS[VALIDATION_TYPES.ARRAY](datum.data, props, dataTree);
        validationMessage = `${index}##${WIDGET_TYPE_VALIDATION_ERROR}: [{ "x": "val", "y": "val" }]`;
        let isValidChart = validatedResponse.isValid;
        if (validatedResponse.isValid) {
          datum.data = validatedResponse.parsed;
          isValidChart = every(
            datum.data,
            (chartPoint: { x: string; y: any }) => {
              return (
                isObject(chartPoint) &&
                isString(chartPoint.x) &&
                !isUndefined(chartPoint.y)
              );
            },
          );
        }
        index++;
        return isValidChart;
      },
    );
    if (!isValidChartData) {
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
        message: validationMessage,
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
        _.isString(option.value) &&
        !_.isEmpty(option.label) &&
        !_.isEmpty(option.value);

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
  [VALIDATION_TYPES.DATE]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const today = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dateFormat = props.dateFormat ? props.dateFormat : ISO_DATE_FORMAT;

    const todayDateString = today.format(dateFormat);
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
    const isValid = moment(dateString, dateFormat).isValid();
    const parsed = isValid ? dateString : todayDateString;
    return {
      isValid,
      parsed,
      message: isValid ? "" : `${WIDGET_TYPE_VALIDATION_ERROR}: Date`,
    };
  },
  [VALIDATION_TYPES.DEFAULT_DATE]: (
    dateString: string,
    props: WidgetProps,
  ): ValidationResponse => {
    const today = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dateFormat = props.dateFormat ? props.dateFormat : ISO_DATE_FORMAT;

    const todayDateString = today.format(dateFormat);
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
    const parsedCurrentDate = moment(dateString, dateFormat);
    let isValid = parsedCurrentDate.isValid();
    const parsedMinDate = moment(props.minDate, dateFormat);
    const parsedMaxDate = moment(props.maxDate, dateFormat);

    // checking for max/min date range
    if (isValid) {
      if (
        parsedMinDate.isValid() &&
        parsedCurrentDate.isBefore(parsedMinDate)
      ) {
        isValid = false;
      }

      if (
        isValid &&
        parsedMaxDate.isValid() &&
        parsedCurrentDate.isAfter(parsedMaxDate)
      ) {
        isValid = false;
      }
    }

    const parsed = isValid ? dateString : todayDateString;

    return {
      isValid,
      parsed,
      message: isValid ? "" : `${WIDGET_TYPE_VALIDATION_ERROR}: Date R`,
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
    /*
    if (_.isString(value)) {
      if (value.indexOf("navigateTo") !== -1) {
        const pageNameOrUrl = modalGetter(value);
        if (dataTree) {
          if (isDynamicValue(pageNameOrUrl)) {
            return {
              isValid: true,
              parsed: value,
            };
          }
          const isPage =
            (dataTree.pageList as PageListPayload).findIndex(
              page => page.pageName === pageNameOrUrl,
            ) !== -1;
          const isValidUrl = URL_REGEX.test(pageNameOrUrl);
          if (!(isValidUrl || isPage)) {
            return {
              isValid: false,
              parsed: value,
              message: `${NAVIGATE_TO_VALIDATION_ERROR}`,
            };
          }
        }
      }
    }
    */
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
    let values = value;

    if (props) {
      if (props.multiRowSelection) {
        if (typeof value === "string") {
          try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) {
              throw new Error();
            }
          } catch {
            values = value.length ? value.split(",") : [];
            if (values.length > 0) {
              let numericValues = values.map((value) => {
                return isNumber(value.trim()) ? -1 : Number(value.trim());
              });
              numericValues = _.uniq(numericValues);
              return {
                isValid: true,
                parsed: numericValues,
              };
            }
          }
        }
      } else {
        try {
          const parsed = toNumber(value);
          return {
            isValid: true,
            parsed: parsed,
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
      parsed: values,
    };
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
};
