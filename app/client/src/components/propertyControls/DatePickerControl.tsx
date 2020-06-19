import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDatePicker } from "./StyledControls";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision } from "@blueprintjs/datetime";
import BaseWidget, { WidgetProps } from "widgets/BaseWidget";

const DatePickerControlWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 8px 0 0 0;
  &&& {
    input {
      background: ${props => props.theme.colors.paneTextBG};
      color: ${props => props.theme.colors.textOnDarkBG};
      font-size: ${props => props.theme.fontSizes[3]}px;
      box-shadow: none;
    }
  }
  .vertical-center {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0 4px 0;
    .label {
      color: ${props => props.theme.colors.paneText};
      font-size: ${props => props.theme.fontSizes[3]}px;
    }
    .bp3-control {
      margin-bottom: 0px;
    }
  }
`;

class DatePickerControl extends BaseControl<
  DatePickerControlProps,
  DatePickerControlState
> {
  now = moment();
  year = this.now.get("year");
  maxDate: Date = this.now
    .clone()
    .set({ month: 11, date: 31, year: this.year + 20 })
    .toDate();
  minDate: Date = this.now
    .clone()
    .set({ month: 0, date: 1, year: this.year - 20 })
    .toDate();

  constructor(props: DatePickerControlProps) {
    super(props);
    this.state = {
      selectedDate: props.propertyValue,
    };
  }

  render() {
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
          maxDate={this.maxDate}
          minDate={this.minDate}
          value={
            this.props.propertyValue
              ? this.parseDate(this.props.propertyValue)
              : null
          }
        />
      </DatePickerControlWrapper>
    );
  }

  onDateSelected = (date: Date): void => {
    const selectedDate = date ? this.formatDate(date) : undefined;
    this.setState({ selectedDate: selectedDate });
    this.updateProperty(this.props.propertyName, selectedDate);
  };

  formatDate = (date: Date): string => {
    return moment(date).format(
      this.props.widgetProperties.dateFormat || "DD/MM/YYYY HH:mm",
    );
  };

  parseDate = (dateStr: string): Date => {
    return moment(
      dateStr,
      this.props.widgetProperties.dateFormat || "DD/MM/YYYY HH:mm",
    ).toDate();
  };

  static getControlType() {
    return "DATE_PICKER";
  }
}

export interface DatePickerControlProps extends ControlProps {
  placeholderText: string;
  propertyValue: string;
  widgetProperties: WidgetProps;
}

interface DatePickerControlState {
  selectedDate?: string;
}

export default DatePickerControl;
