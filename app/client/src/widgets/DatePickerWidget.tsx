import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class DatePickerWidget extends BaseWidget<DatePickerWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      defaultDate: VALIDATION_TYPES.DATE,
      selectedDate: VALIDATION_TYPES.DATE,
      timezone: VALIDATION_TYPES.TEXT,
      enableTimePicker: VALIDATION_TYPES.BOOLEAN,
      dateFormat: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      datePickerType: VALIDATION_TYPES.TEXT,
      maxDate: VALIDATION_TYPES.DATE,
      minDate: VALIDATION_TYPES.DATE,
    };
  }
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onDateSelected: true,
    };
  }
  getPageView() {
    return (
      <DatePickerComponent
        label={this.props.label}
        dateFormat={this.props.dateFormat}
        widgetId={this.props.widgetId}
        timezone={this.props.timezone}
        enableTimePicker={this.props.enableTimePicker}
        defaultDate={this.props.defaultDate}
        datePickerType={"DATE_PICKER"}
        onDateSelected={this.onDateSelected}
        selectedDate={this.props.selectedDate}
        isLoading={this.props.isLoading}
      />
    );
  }

  onDateSelected = (selectedDate: Date) => {
    this.updateWidgetProperty("selectedDate", selectedDate);
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
  defaultDate?: Date;
  selectedDate: Date;
  timezone?: string;
  enableTimePicker: boolean;
  dateFormat: string;
  label: string;
  datePickerType: DatePickerType;
  onDateSelected?: string;
  onDateRangeSelected?: string;
  maxDate: Date;
  minDate: Date;
}

export default DatePickerWidget;
