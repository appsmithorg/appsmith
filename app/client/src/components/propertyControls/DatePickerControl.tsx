import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDatePicker } from "./StyledControls";
import moment from "moment-timezone";

class DatePickerControl extends BaseControl<DatePickerControlProps> {
  render() {
    return (
      <StyledDatePicker
        formatDate={this.formatDate}
        parseDate={this.parseDate}
        placeholder={"DD/MM/YYYY"}
        showActionsBar={true}
        timePickerProps={{
          useAmPm: true,
          value: new Date(this.props.propertyValue),
          showArrowButtons: true,
        }}
        onChange={this.onDateSelected}
        value={new Date(this.props.propertyValue)}
      />
    );
  }

  formatDate = (date: Date): string => {
    return moment(date).format("DD/MM/YYYY");
  };

  parseDate = (dateStr: string): Date => {
    return moment(dateStr).toDate();
  };

  onDateSelected = (date: Date): void => {
    this.updateProperty(this.props.propertyName, date);
  };

  static getControlType() {
    return "DATE_PICKER";
  }
}

export interface DatePickerControlProps extends ControlProps {
  placeholderText: string;
  propertyValue: Date;
  enableTimePicker: boolean;
}

export default DatePickerControl;
