import _ from "lodash";
import {
  VALIDATION_TYPES,
  ValidationResponse,
  ValidationType,
  Validator,
} from "constants/WidgetValidation";
import moment from "moment";
import {
  WIDGET_TYPE_VALIDATION_ERROR,
  // NAVIGATE_TO_VALIDATION_ERROR,
} from "constants/messages";
// import { modalGetter } from "components/editorComponents/actioncreator/ActionCreator";
import { WidgetProps } from "widgets/BaseWidget";
import { DataTree } from "entities/DataTree/dataTreeFactory";
// import { PageListPayload } from "constants/ReduxActionConstants";
// import { isDynamicValue } from "./DynamicBindingUtils";
// const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

export const VALIDATORS: Record<ValidationType, Validator> = {
  [VALIDATION_TYPES.TEXT]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (_.isUndefined(value) || value === null) {
      return {
        isValid: true,
        parsed: "",
        message: "",
      };
    }
    if (_.isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: text`,
      };
    }
    let isValid = _.isString(value);
    if (!isValid) {
      try {
        parsed = _.toString(value);
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
  [VALIDATION_TYPES.NUMBER]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (_.isUndefined(value)) {
      return {
        isValid: false,
        parsed: 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
      };
    }
    let isValid = _.isNumber(value);
    if (!isValid) {
      try {
        parsed = _.toNumber(value);
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
  [VALIDATION_TYPES.BOOLEAN]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (_.isUndefined(value)) {
      return {
        isValid: false,
        parsed: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: boolean`,
      };
    }
    const isBoolean = _.isBoolean(value);
    const isStringTrueFalse = value === "true" || value === "false";
    const isValid = isBoolean || isStringTrueFalse;
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
  [VALIDATION_TYPES.OBJECT]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (_.isUndefined(value)) {
      return {
        isValid: false,
        parsed: {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    }
    let isValid = _.isObject(value);
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
  [VALIDATION_TYPES.ARRAY]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    try {
      if (_.isUndefined(value)) {
        return {
          isValid: false,
          parsed: [],
          transformed: undefined,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
        };
      }
      if (_.isString(value)) {
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
    } else if (!_.every(parsed, datum => _.isObject(datum))) {
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
    const { isValid, transformed, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
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
    const isValidTableData = _.every(parsed, datum => {
      return (
        _.isObject(datum) &&
        Object.keys(datum).filter(key => _.isString(key) && key.length === 0)
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
    if (_.isString(value)) {
      value = value.replace(/\s/g, "");
      value = `${value}`;
    }
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
    const isValidChartData = _.every(
      parsed,
      (datum: { name: string; data: any }) => {
        const validatedResponse: {
          isValid: boolean;
          parsed: object;
          message?: string;
        } = VALIDATORS[VALIDATION_TYPES.ARRAY](datum.data, props, dataTree);
        validationMessage = `${index}##${WIDGET_TYPE_VALIDATION_ERROR}: [{ "x": "val", "y": "val" }]`;
        let isValidChart = validatedResponse.isValid;
        if (validatedResponse.isValid) {
          datum.data = validatedResponse.parsed;
          isValidChart = _.every(
            datum.data,
            (chartPoint: { x: string; y: any }) => {
              return (
                _.isObject(chartPoint) &&
                _.isString(chartPoint.x) &&
                !_.isUndefined(chartPoint.y)
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
    } else if (!_.every(parsed, datum => _.isObject(datum))) {
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
    const hasOptions = _.every(parsed, (datum: { label: any; value: any }) => {
      if (_.isObject(datum)) {
        return _.isString(datum.label) && _.isString(datum.value);
      } else {
        return false;
      }
    });
    if (!hasOptions) {
      return {
        isValid: false,
        parsed: [],
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Options Data`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.DATE]: (
    dateString: string,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const today = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dateFormat = props.dateFormat ? props.dateFormat : moment.ISO_8601;
    // const dateStr = moment().toISOString();
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
  [VALIDATION_TYPES.ACTION_SELECTOR]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
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
    dataTree?: DataTree,
  ): ValidationResponse => {
    const tabs =
      props.tabs && _.isString(props.tabs)
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
};
