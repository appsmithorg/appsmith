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
import { TimePrecision } from "@blueprintjs/datetime";
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
  &&& {
    input {
      border: 1px solid ${Colors.HIT_GRAY};
      border-radius: ${props => props.theme.radii[1]}px;
      box-shadow: none;
      color: ${Colors.OXFORD_BLUE};
      font-size: ${props => props.theme.fontSizes[3]}px;
    }
  }
`;

class DatePickerComponent extends React.Component<DatePickerComponentProps> {
  render() {
    const now = moment();
    const year = now.get("year");
    const month = now.get("month");
    const date = now.get("date");
    const minDate = now.clone().set({ month, date: date - 1, year: year - 20 });
    const maxDate = now.clone().set({ month, date: date + 1, year: year + 20 });
    const selectedDate = new Date(
      new Date(this.props.selectedDate || "").getTime() +
        this.getOffset(new Date(this.props.selectedDate || "")),
    );
    return (
      <StyledControlGroup
        fill
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
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
            timePrecision={
              this.props.enableTimePicker ? TimePrecision.MINUTE : undefined
            }
            closeOnSelection
            onChange={this.onDateSelected}
            value={selectedDate}
            maxDate={maxDate.toDate()}
            minDate={minDate.toDate()}
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

  getOffset = (date: Date) => {
    const timezone = this.props.timezone || moment.tz.guess();
    return moment.tz.zone(timezone)!.utcOffset(date.getTime()) * 60 * 1000;
  };

  formatDate = (date: Date): string => {
    let dateFormat = "DD/MM/YYYY";
    if (this.props.enableTimePicker) {
      dateFormat = "DD/MM/YYYY HH:mm";
    }
    return moment(date).format(dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    return moment(dateStr).toDate();
  };

  onDateSelected = (selectedDate: Date) => {
    const dateValue = new Date(
      selectedDate.getTime() - this.getOffset(selectedDate),
    ).getTime();
    this.props.onDateSelected(new Date(dateValue));
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
  isDisabled: boolean;
  onDateSelected: (date: Date) => void;
  isLoading: boolean;
}

export default DatePickerComponent;
