import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent2";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import moment from "moment";

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
          },
          {
            helpText: "Sets the format of the selected date",
            propertyName: "dateFormat",
            label: "Date Format",
            controlType: "DROP_DOWN",
            isJSConvertible: true,
            optionWidth: "320px",
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
                label: moment().format("YYYY-MM-DD hh:mm:ss"),
                subText: "YYYY-MM-DD hh:mm:ss",
                value: "YYYY-MM-DD hh:mm:ss",
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
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
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
          },
        ],
      },
      {
        sectionName: "Actions",
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

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      defaultDate: VALIDATION_TYPES.DEFAULT_DATE,
      timezone: VALIDATION_TYPES.TEXT,
      enableTimePicker: VALIDATION_TYPES.BOOLEAN,
      dateFormat: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      datePickerType: VALIDATION_TYPES.TEXT,
      maxDate: VALIDATION_TYPES.DATE_ISO_STRING,
      minDate: VALIDATION_TYPES.DATE_ISO_STRING,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onDateSelected: VALIDATION_TYPES.ACTION_SELECTOR,
      // onDateRangeSelected: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedDate : true }}`,
      selectedDate: `{{ this.value ? moment(this.value).toISOString() : (this.defaultDate ? moment(this.defaultDate).toISOString() : "")}}`,
      formattedDate: `{{ this.value ? moment(this.value).format(this.dateFormat) : (this.defaultDate ? moment(this.defaultDate).format(this.dateFormat) : "")}}`,
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
        label={`${this.props.label}`}
        dateFormat={this.props.dateFormat}
        widgetId={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        datePickerType={"DATE_PICKER"}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.value}
        isLoading={this.props.isLoading}
        minDate={this.props.minDate}
        maxDate={this.props.maxDate}
      />
    );
  }

  onDateSelected = (selectedDate: string) => {
    this.props.updateWidgetMetaProperty("value", selectedDate, {
      dynamicString: this.props.onDateSelected,
      event: {
        type: EventType.ON_DATE_SELECTED,
      },
    });
  };

  getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET2";
  }
}

export type DatePickerType = "DATE_PICKER" | "DATE_RANGE_PICKER";

export interface DatePickerWidget2Props extends WidgetProps, WithMeta {
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
}

export default DatePickerWidget;
export const ProfiledDatePickerWidget2 = Sentry.withProfiler(
  withMeta(DatePickerWidget),
);
