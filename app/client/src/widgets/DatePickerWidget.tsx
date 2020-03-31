import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";

class DatePickerWidget extends BaseWidget<DatePickerWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      defaultDate: VALIDATION_TYPES.DATE,
      timezone: VALIDATION_TYPES.TEXT,
      enableTimePicker: VALIDATION_TYPES.BOOLEAN,
      dateFormat: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      datePickerType: VALIDATION_TYPES.TEXT,
      maxDate: VALIDATION_TYPES.DATE,
      minDate: VALIDATION_TYPES.DATE,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      onDateSelected: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedDate : true }}`,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onDateSelected: true,
    };
  }

  componentDidUpdate(prevProps: DatePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (this.props.defaultDate) {
      if (
        (this.props.selectedDate !== prevProps.selectedDate &&
          this.props.selectedDate === undefined) ||
        prevProps.defaultDate === undefined ||
        this.props.defaultDate.toDateString() !==
          prevProps.defaultDate.toDateString()
      ) {
        this.updateWidgetMetaProperty("selectedDate", this.props.defaultDate);
      }
    }
  }

  getPageView() {
    return (
      <DatePickerComponent
        label={`${this.props.label}${this.props.isRequired ? " *" : ""}`}
        dateFormat={this.props.dateFormat}
        widgetId={this.props.widgetId}
        timezone={this.props.timezone}
        enableTimePicker={this.props.enableTimePicker}
        isDisabled={this.props.isDisabled}
        datePickerType={"DATE_PICKER"}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.selectedDate}
        isLoading={this.props.isLoading}
      />
    );
  }

  onDateSelected = (selectedDate: Date) => {
    this.updateWidgetMetaProperty("selectedDate", selectedDate);
    if (this.props.onDateSelected) {
      super.executeAction({
        dynamicString: this.props.onDateSelected,
        event: {
          type: EventType.ON_DATE_SELECTED,
        },
      });
    }
  };

  getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET";
  }
}

export type DatePickerType = "DATE_PICKER" | "DATE_RANGE_PICKER";

export interface DatePickerWidgetProps extends WidgetProps {
  defaultDate: Date;
  selectedDate: Date;
  timezone?: string;
  enableTimePicker: boolean;
  isDisabled: boolean;
  dateFormat: string;
  label: string;
  datePickerType: DatePickerType;
  onDateSelected?: string;
  onDateRangeSelected?: string;
  maxDate: Date;
  minDate: Date;
  isRequired?: boolean;
}

export default DatePickerWidget;
