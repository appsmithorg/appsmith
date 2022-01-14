import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DatePickerComponent from "../component";
import {
  ISO_DATE_FORMAT,
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import moment from "moment";
import { DatePickerType } from "../constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function defaultDateValidation(
  value: unknown,
  props: DatePickerWidgetProps,
  _?: any,
  moment?: any,
): ValidationResponse {
  const dateFormat = props.dateFormat || ISO_DATE_FORMAT;
  if (value === null) {
    return {
      isValid: true,
      parsed: "",
      messages: [""],
    };
  }
  if (value === undefined) {
    return {
      isValid: false,
      parsed: "",
      messages: [`This value does not evaluate to type: Date ${dateFormat}`],
    };
  }

  const isValid = moment(value as string, dateFormat).isValid();

  return {
    isValid,
    parsed: isValid ? value : "",
    messages:
      isValid === false
        ? [`Value does not match ISO 8601 standard date string`]
        : [""],
  };
}

function minDateValidation(
  value: unknown,
  props: DatePickerWidgetProps,
  _?: any,
  moment?: any,
): ValidationResponse {
  const dateFormat = props.dateFormat || ISO_DATE_FORMAT;
  if (value === undefined) {
    return {
      isValid: false,
      parsed: "",
      messages: [
        `Value does not match: Date String ` + (dateFormat ? dateFormat : ""),
      ],
    };
  }
  const parsedMinDate = moment(value as string, dateFormat);
  let isValid = parsedMinDate.isValid();

  if (!props.defaultDate) {
    return {
      isValid: isValid,
      parsed: value,
      messages: [""],
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
      messages: [
        `Value does not match: Date String ` + (dateFormat ? dateFormat : ""),
      ],
    };
  }
  return {
    isValid: isValid,
    parsed: value,
    messages: [""],
  };
}

function maxDateValidation(
  value: unknown,
  props: DatePickerWidgetProps,
  _?: any,
  moment?: any,
): ValidationResponse {
  const dateFormat = props.dateFormat || ISO_DATE_FORMAT;
  if (value === undefined) {
    return {
      isValid: false,
      parsed: "",
      messages: [
        `Value does not match type: Date String ` +
          (dateFormat ? dateFormat : ""),
      ],
    };
  }
  const parsedMaxDate = moment(value as string, dateFormat);
  let isValid = parsedMaxDate.isValid();
  if (!props.defaultDate) {
    return {
      isValid: isValid,
      parsed: value,
      messages: [""],
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
      messages: [
        `Value does not match type: Date String ` +
          (dateFormat ? dateFormat : ""),
      ],
    };
  }
  return {
    isValid: isValid,
    parsed: value,
    messages: [""],
  };
}
class DatePickerWidget extends BaseWidget<DatePickerWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultDate",
            label: "Default Date",
            helpText:
              "Sets the default date of the widget. The date is updated if the default date changes",
            controlType: "DATE_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultDateValidation,
                expected: {
                  type: "ISO 8601 string",
                  example: moment().toISOString(),
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["dateFormat"],
          },
          {
            helpText: "Sets the format of the selected date",
            propertyName: "dateFormat",
            label: "Date Format",
            controlType: "DROP_DOWN",
            isJSConvertible: true,
            options: [
              {
                label: "YYYY-MM-DD",
                value: "YYYY-MM-DD",
              },
              {
                label: "YYYY-MM-DD HH:mm",
                value: "YYYY-MM-DD HH:mm",
              },
              {
                label: "YYYY-MM-DDTHH:mm:ss.sssZ",
                value: "YYYY-MM-DDTHH:mm:ss.sssZ",
              },
              {
                label: "DD/MM/YYYY",
                value: "DD/MM/YYYY",
              },
              {
                label: "DD/MM/YYYY HH:mm",
                value: "DD/MM/YYYY HH:mm",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "minDate",
            label: "Min Date",
            helpText: "Defines the min date for this widget",
            controlType: "DATE_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: minDateValidation,
                expected: {
                  type: "ISO 8601 string",
                  example: moment().toISOString(),
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["dateFormat", "defaultDate"],
          },
          {
            propertyName: "maxDate",
            label: "Max Date",
            helpText: "Defines the max date for this widget",
            controlType: "DATE_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: maxDateValidation,
                expected: {
                  type: "ISO 8601 string",
                  example: moment().toISOString(),
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["dateFormat", "defaultDate"],
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            propertyName: "onDateSelected",
            label: "onDateSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedDate : true }}`,
      value: `{{ this.selectedDate }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedDate: "defaultDate",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDate: undefined,
    };
  }

  componentDidUpdate(prevProps: DatePickerWidgetProps) {
    if (this.props.dateFormat !== prevProps.dateFormat) {
      if (this.props.defaultDate) {
        const defaultDate = moment(
          this.props.defaultDate,
          this.props.dateFormat,
        );
        if (!defaultDate.isValid()) {
          super.updateWidgetProperty("defaultDate", "");
        } else {
          if (this.props.minDate) {
            const minDate = moment(this.props.minDate, this.props.dateFormat);
            if (!minDate.isValid() || defaultDate.isBefore(minDate)) {
              super.updateWidgetProperty("defaultDate", "");
            }
          }
          if (this.props.maxDate) {
            const maxDate = moment(this.props.maxDate, this.props.dateFormat);
            if (!maxDate.isValid() || defaultDate.isAfter(maxDate)) {
              super.updateWidgetProperty("defaultDate", "");
            }
          }
        }
      }
    }
  }

  getPageView() {
    return (
      <DatePickerComponent
        dateFormat={this.props.dateFormat}
        datePickerType={"DATE_PICKER"}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        maxDate={this.props.maxDate}
        minDate={this.props.minDate}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.selectedDate}
        widgetId={this.props.widgetId}
      />
    );
  }

  onDateSelected = (selectedDate: string) => {
    this.props.updateWidgetMetaProperty("selectedDate", selectedDate, {
      triggerPropertyName: "onDateSelected",
      dynamicString: this.props.onDateSelected,
      event: {
        type: EventType.ON_DATE_SELECTED,
      },
    });
  };

  static getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET";
  }
}

export interface DatePickerWidgetProps extends WidgetProps {
  defaultDate: string;
  selectedDate: string;
  isDisabled: boolean;
  dateFormat: string;
  label: string;
  datePickerType: DatePickerType;
  onDateSelected?: string;
  onDateRangeSelected?: string;
  maxDate: string;
  minDate: string;
  isRequired?: boolean;
}

export default DatePickerWidget;
