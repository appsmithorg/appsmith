import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { DateInput, DateRangeInput } from "@blueprintjs/datetime";
import { Container } from "../appsmith/ContainerComponent";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType } from "../../../widgets/DatePickerWidget";

class DatePickerComponent extends React.Component<DatePickerComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        {this.props.datePickerType === "DATE_PICKER" ? (
          <DateInput
            formatDate={this.formatDate}
            parseDate={this.parseDate}
            placeholder={this.props.dateFormat}
            disabled={this.props.isDisabled}
            showActionsBar={true}
            timePickerProps={
              this.props.enableTimePicker
                ? {
                    useAmPm: true,
                    value: this.props.selectedDate || this.props.defaultDate,
                    showArrowButtons: true,
                  }
                : undefined
            }
            closeOnSelection={true}
            onChange={this.onDateSelected}
            value={this.props.selectedDate || this.props.defaultDate}
          />
        ) : (
          <DateRangeInput
            allowSingleDayRange={true}
            disabled={this.props.isDisabled}
            contiguousCalendarMonths={false}
            formatDate={this.formatDate}
            minDate={this.props.minDate}
            maxDate={this.props.maxDate}
            closeOnSelection={true}
          />
        )}
      </Container>
    );
  }

  formatDate = (date: Date): string => {
    if (this.props.defaultTimezone) {
      return moment(date)
        .tz(this.props.defaultTimezone)
        .format(this.props.dateFormat);
    }
    return moment(date).format(this.props.dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    if (this.props.defaultTimezone) {
      return moment(dateStr)
        .tz(this.props.defaultTimezone)
        .toDate();
    }
    return moment(dateStr).toDate();
  };

  onDateSelected = (selectedDate: Date) => {
    this.props.onDateSelected(selectedDate);
  };
}

export interface DatePickerComponentProps extends ComponentProps {
  label: string;
  defaultDate?: Date;
  dateFormat: string;
  enableTimePicker?: boolean;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  defaultTimezone?: string;
  datePickerType: DatePickerType;
  onDateSelected: (date: Date) => void;
}

export default DatePickerComponent;
