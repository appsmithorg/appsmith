import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDatePicker } from "./StyledControls";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision } from "@blueprintjs/datetime";

const DatePickerControlWrapper = styled.div`
  display: flex;
  flex-direction: column;
  &&& {
    input {
      background: ${props => props.theme.colors.paneTextBG};
      color: ${props => props.theme.colors.textOnDarkBG};
      font-size: ${props => props.theme.fontSizes[3]}px;
      box-shadow: none;
    }
  }
`;

class DatePickerControl extends BaseControl<DatePickerControlProps> {
  render() {
    const now = moment();
    const year = now.get("year");
    const date = now.get("date");
    const month = now.get("month");
    const minDate = now.clone().set({ month, date: date - 1, year: year - 20 });
    const maxDate = now.clone().set({ month, date: date + 1, year: year + 20 });
    return (
      <DatePickerControlWrapper>
        <StyledDatePicker
          formatDate={this.formatDate}
          parseDate={this.parseDate}
          placeholder="DD/MM/YYYY HH:mm"
          showActionsBar
          timePrecision={TimePrecision.MINUTE}
          closeOnSelection
          onChange={this.onDateSelected}
          maxDate={maxDate.toDate()}
          minDate={minDate.toDate()}
          value={moment(this.props.propertyValue).toDate()}
        />
      </DatePickerControlWrapper>
    );
  }

  onDateSelected = (date: Date): void => {
    this.updateProperty(
      this.props.propertyName,
      moment(date).toISOString(true),
    );
  };

  formatDate = (date: Date): string => {
    return moment(date).format("DD/MM/YYYY HH:mm");
  };

  parseDate = (dateStr: string): Date => {
    return moment(dateStr).toDate();
  };

  static getControlType() {
    return "DATE_PICKER";
  }
}

export interface DatePickerControlProps extends ControlProps {
  placeholderText: string;
  propertyValue: string;
}

export default DatePickerControl;
