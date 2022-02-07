import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DatePickerComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

import moment from "moment";
import derivedProperties from "./parseDerivedProperties";
import { DatePickerType, TimePrecision } from "../constants";

function allowedRange(value: any) {
  const allowedValues = [0, 1, 2, 3, 4, 5, 6];
  const isValid = allowedValues.includes(Number(value));
  return {
    isValid: isValid,
    parsed: isValid ? Number(value) : 0,
    messages: isValid ? [] : ["Number should be between 0-6."],
  };
}
class DatePickerWidget extends BaseWidget<DatePickerWidget2Props, WidgetState> {
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
            placeholderText: "Enter Default Date",
            useValidationMessage: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.DATE_ISO_STRING },
          },
          {
            helpText: "Sets the format of the selected date",
            propertyName: "dateFormat",
            label: "Date Format",
            controlType: "DROP_DOWN",
            isJSConvertible: true,
            optionWidth: "340px",
            options: [
              {
                label: moment().format("YYYY-MM-DDTHH:mm:ss.sssZ"),
                subText: "ISO 8601",
                value: "YYYY-MM-DDTHH:mm:ss.sssZ",
              },
              {
                label: moment().format("LLL"),
                subText: "LLL",
                value: "LLL",
              },
              {
                label: moment().format("LL"),
                subText: "LL",
                value: "LL",
              },
              {
                label: moment().format("YYYY-MM-DD HH:mm"),
                subText: "YYYY-MM-DD HH:mm",
                value: "YYYY-MM-DD HH:mm",
              },
              {
                label: moment().format("YYYY-MM-DDTHH:mm:ss"),
                subText: "YYYY-MM-DDTHH:mm:ss",
                value: "YYYY-MM-DDTHH:mm:ss",
              },
              {
                label: moment().format("YYYY-MM-DD hh:mm:ss A"),
                subText: "YYYY-MM-DD hh:mm:ss A",
                value: "YYYY-MM-DD hh:mm:ss A",
              },
              {
                label: moment().format("DD/MM/YYYY HH:mm"),
                subText: "DD/MM/YYYY HH:mm",
                value: "DD/MM/YYYY HH:mm",
              },
              {
                label: moment().format("D MMMM, YYYY"),
                subText: "D MMMM, YYYY",
                value: "D MMMM, YYYY",
              },
              {
                label: moment().format("H:mm A D MMMM, YYYY"),
                subText: "H:mm A D MMMM, YYYY",
                value: "H:mm A D MMMM, YYYY",
              },
              {
                label: moment().format("YYYY-MM-DD"),
                subText: "YYYY-MM-DD",
                value: "YYYY-MM-DD",
              },
              {
                label: moment().format("MM-DD-YYYY"),
                subText: "MM-DD-YYYY",
                value: "MM-DD-YYYY",
              },
              {
                label: moment().format("DD-MM-YYYY"),
                subText: "DD-MM-YYYY",
                value: "DD-MM-YYYY",
              },
              {
                label: moment().format("MM/DD/YYYY"),
                subText: "MM/DD/YYYY",
                value: "MM/DD/YYYY",
              },
              {
                label: moment().format("DD/MM/YYYY"),
                subText: "DD/MM/YYYY",
                value: "DD/MM/YYYY",
              },
              {
                label: moment().format("DD/MM/YY"),
                subText: "DD/MM/YY",
                value: "DD/MM/YY",
              },
              {
                label: moment().format("MM/DD/YY"),
                subText: "MM/DD/YY",
                value: "MM/DD/YY",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hideSubText: true,
          },
          {
            propertyName: "timePrecision",
            label: "Time precision",
            controlType: "DROP_DOWN",
            helpText: "Sets the different time picker or hide.",
            defaultValue: TimePrecision.MINUTE,
            options: [
              {
                label: "None",
                value: TimePrecision.NONE,
              },
              {
                label: "Minute",
                value: TimePrecision.MINUTE,
              },
              {
                label: "Second",
                value: TimePrecision.SECOND,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  TimePrecision.NONE,
                  TimePrecision.MINUTE,
                  TimePrecision.SECOND,
                ],
                default: TimePrecision.MINUTE,
              },
            },
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
            propertyName: "closeOnSelection",
            label: "Close On Selection",
            helpText: "Calender should close when a date is selected",
            controlType: "SWITCH",
            defaultValue: true,
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "shortcuts",
            label: "Show Shortcuts",
            helpText: "Choose to show shortcut menu",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "minDate",
            label: "Min Date",
            helpText: "Defines the min date for this widget",
            controlType: "DATE_PICKER",
            useValidationMessage: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.DATE_ISO_STRING },
          },
          {
            propertyName: "maxDate",
            label: "Max Date",
            helpText: "Defines the max date for this widget",
            controlType: "DATE_PICKER",
            useValidationMessage: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.DATE_ISO_STRING },
          },
          {
            propertyName: "firstDayOfWeek",
            label: "First Day Of Week",
            helpText: "Defines the first day of the week for calendar",
            controlType: "INPUT_TEXT",
            defaultValue: "0",
            inputType: "INTEGER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: allowedRange,
                expected: {
                  type:
                    "0 : sunday\n1 : monday\n2 : tuesday\n3 : wednesday\n4 : thursday\n5 : friday\n6 : saturday",
                  example: "0",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
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
      isValid: `{{(()=>{${derivedProperties.isValidDate}})()}}`,
      selectedDate: `{{ this.value ? moment(this.value).toISOString() : "" }}`,
      formattedDate: `{{ this.value ? moment(this.value).format(this.dateFormat) : "" }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      value: "defaultDate",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  getPageView() {
    return (
      <DatePickerComponent
        closeOnSelection={this.props.closeOnSelection}
        dateFormat={this.props.dateFormat}
        datePickerType={"DATE_PICKER"}
        firstDayOfWeek={this.props.firstDayOfWeek}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        maxDate={this.props.maxDate}
        minDate={this.props.minDate}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.value}
        shortcuts={this.props.shortcuts}
        timePrecision={this.props.timePrecision}
        widgetId={this.props.widgetId}
      />
    );
  }

  onDateSelected = (selectedDate: string) => {
    this.props.updateWidgetMetaProperty("value", selectedDate, {
      triggerPropertyName: "onDateSelected",
      dynamicString: this.props.onDateSelected,
      event: {
        type: EventType.ON_DATE_SELECTED,
      },
    });
  };

  static getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET2";
  }
}

export interface DatePickerWidget2Props extends WidgetProps {
  defaultDate: string;
  selectedDate: string;
  formattedDate: string;
  isDisabled: boolean;
  dateFormat: string;
  label: string;
  datePickerType: DatePickerType;
  onDateSelected?: string;
  onDateRangeSelected?: string;
  maxDate: string;
  minDate: string;
  isRequired?: boolean;
  closeOnSelection: boolean;
  shortcuts: boolean;
  firstDayOfWeek?: number;
  timePrecision: TimePrecision;
}

export default DatePickerWidget;
