import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DatePickerComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import moment from "moment";
import { DatePickerType } from "../constants";

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
            propertyName: "closeOnSelection",
            label: "Close On Selection",
            helpText: "Calender should close when a date is selected",
            controlType: "SWITCH",
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

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedDate : true }}`,
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
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        maxDate={this.props.maxDate}
        minDate={this.props.minDate}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.value}
        shortcuts={this.props.shortcuts}
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
}

export default DatePickerWidget;
