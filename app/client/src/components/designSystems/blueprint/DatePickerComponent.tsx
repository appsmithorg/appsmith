import React from "react";
import styled from "styled-components";
import { ControlGroup, Classes, Label } from "@blueprintjs/core";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { DateInput, DateRangeInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType } from "widgets/DatePickerWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    label {
      flex: 0 1 30%;
      text-align: right;
      margin: 0 ${WIDGET_PADDING}px 0 0;
      align-self: center;
    }
  }
`;
class DatePickerComponent extends React.Component<DatePickerComponentProps> {
  render() {
    return (
      <StyledControlGroup fill>
        <Label className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
          {this.props.label}
        </Label>
        {this.props.datePickerType === "DATE_PICKER" ? (
          <DateInput
            className={this.props.isLoading ? "bp3-skeleton" : ""}
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
            className={this.props.isLoading ? "bp3-skeleton" : ""}
            allowSingleDayRange={true}
            disabled={this.props.isDisabled}
            contiguousCalendarMonths={false}
            formatDate={this.formatDate}
            minDate={this.props.minDate}
            maxDate={this.props.maxDate}
            closeOnSelection={true}
          />
        )}
      </StyledControlGroup>
    );
  }

  formatDate = (date: Date): string => {
    if (this.props.timezone) {
      return moment(date)
        .tz(this.props.timezone)
        .format(this.props.dateFormat);
    }
    return moment(date).format(this.props.dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    if (this.props.timezone) {
      return moment(dateStr)
        .tz(this.props.timezone)
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
  timezone?: string;
  datePickerType: DatePickerType;
  onDateSelected: (date: Date) => void;
  isLoading: boolean;
}

export default DatePickerComponent;
