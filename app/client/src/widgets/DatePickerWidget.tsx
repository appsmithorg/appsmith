import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";
import DatePickerComponent from "../components/designSystems/blueprint/DatePickerComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

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
      />
    );
  }

  onDateSelected = (selectedDate: Date) => {
    this.context.updateWidgetProperty(
      this.props.widgetId,
      "selectedDate",
      selectedDate,
    );
    super.executeAction(this.props.onDateSelected);
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
  onDateSelected: ActionPayload[];
  onDateRangeSelected: ActionPayload[];
  maxDate: Date;
  minDate: Date;
}

export default DatePickerWidget;
