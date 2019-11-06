import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";
import DatePickerComponent from "../components/designSystems/blueprint/DatePickerComponent";

class DatePickerWidget extends BaseWidget<DatePickerWidgetProps, WidgetState> {
  getPageView() {
    return (
      <DatePickerComponent
        label={this.props.label}
        dateFormat={this.props.dateFormat}
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        defaultTimezone={this.props.defaultTimezone}
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
  defaultTimezone?: string;
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
