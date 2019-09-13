import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { Moment } from "moment";

class DatePickerWidget extends BaseWidget<DatePickerWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
  }

  getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET";
  }
}

//Taken from https://blueprintjs.com/docs/#timezone/timezone-picker, needs to be completed with entire list
export type TimeZone = "Asia/Kolkata" | "Pacific/Midway";
export type DatePickerType = "DATE_PICKER" | "DATE_RANGE_PICKER";

export interface DatePickerWidgetProps extends WidgetProps {
  defaultDate?: Date;
  timezone?: TimeZone;
  enableTime: boolean;
  label: string;
  datePickerType: DatePickerType;
}

export default DatePickerWidget;
