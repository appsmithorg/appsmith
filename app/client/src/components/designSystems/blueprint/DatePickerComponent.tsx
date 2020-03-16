import React from "react";
import styled from "styled-components";
import { labelStyle } from "constants/DefaultTheme";
import { ControlGroup, Classes, Label } from "@blueprintjs/core";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { DateInput, DateRangeInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType } from "widgets/DatePickerWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    .${Classes.INPUT} {
      box-shadow: none;
      border: 1px solid;
      border-color: ${Colors.GEYSER_LIGHT};
      border-radius: ${props => props.theme.radii[1]}px;
      width: 100%;
      height: inherit;
      align-items: center;
      &:active {
        border-color: ${Colors.HIT_GRAY};
      }
      &:focus {
        border-color: ${Colors.MYSTIC};
      }
    }
    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
    }
    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
    label {
      ${labelStyle}
      flex: 0 1 30%;
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      text-align: right;
      align-self: flex-start;
      max-width: calc(30% - ${WIDGET_PADDING}px);
    }
  }
`;
class DatePickerComponent extends React.Component<DatePickerComponentProps> {
  render() {
    return (
      <StyledControlGroup fill>
        {this.props.label && (
          <Label
            className={
              this.props.isLoading
                ? Classes.SKELETON
                : Classes.TEXT_OVERFLOW_ELLIPSIS
            }
          >
            {this.props.label}
          </Label>
        )}
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
                    value: this.props.selectedDate,
                    showArrowButtons: true,
                  }
                : undefined
            }
            closeOnSelection={true}
            onChange={this.onDateSelected}
            value={this.props.selectedDate}
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
