import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision } from "@blueprintjs/datetime";
import { WidgetProps } from "widgets/BaseWidget";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import DatePickerComponent from "components/ads/DatePickerComponent";

const DatePickerControlWrapper = styled.div<{ isValid: boolean }>`
  display: flex;
  flex-direction: column;
  margin: 8px 0 0 0;
  /* &&& {
    input {
      background: ${(props) => props.theme.colors.paneTextBG};
      color: ${(props) => props.theme.colors.textOnDarkBG};
      font-size: ${(props) => props.theme.fontSizes[3]}px;
      box-shadow: none;
      border: ${(props) =>
        !props.isValid
          ? `1px solid ${props.theme.colors.error}`
          : `1px solid transparent`};
    }
  } */
  .vertical-center {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0 4px 0;
    .label {
      color: ${(props) => props.theme.colors.paneText};
      font-size: ${(props) => props.theme.fontSizes[3]}px;
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
    .set({ month: 11, date: 31, year: this.year + 100 })
    .toDate();
  minDate: Date = this.now
    .clone()
    .set({ month: 0, date: 1, year: this.year - 150 })
    .toDate();

  constructor(props: DatePickerControlProps) {
    super(props);
    this.state = {
      selectedDate: props.propertyValue,
    };
  }

  render() {
    const version = this.props.widgetProperties.version;
    const dateFormat =
      version === 2
        ? ISO_DATE_FORMAT
        : this.props.widgetProperties.dateFormat || ISO_DATE_FORMAT;
    const isValid = this.state.selectedDate
      ? this.validateDate(moment(this.state.selectedDate, dateFormat).toDate())
      : true;
    const value =
      this.props.propertyValue && isValid
        ? version === 2
          ? new Date(this.props.propertyValue)
          : this.parseDate(this.props.propertyValue)
        : null;
    return (
      <DatePickerControlWrapper isValid>
        <DatePickerComponent
          closeOnSelection
          formatDate={this.formatDate}
          maxDate={this.maxDate}
          minDate={this.minDate}
          onChange={this.onDateSelected}
          parseDate={this.parseDate}
          placeholder="YYYY-MM-DD HH:mm"
          showActionsBar
          timePrecision={TimePrecision.MINUTE}
          value={value}
        />
      </DatePickerControlWrapper>
    );
  }

  getValidDate = (date: string, format: string) => {
    const _date = moment(date, format);
    return _date.isValid() ? _date.toDate() : undefined;
  };

  /**
   * here we put the selected state into state
   * before putting it into state, we check if widget date is in range
   * of property value ( min /max range )
   *
   * @param date
   */
  onDateSelected = (date: Date | null, isUserChange: boolean): void => {
    if (isUserChange) {
      const selectedDate = date
        ? this.props.widgetProperties.version === 2
          ? date.toISOString()
          : this.formatDate(date)
        : undefined;
      const isValid = date ? this.validateDate(date) : true;
      if (!isValid) return;
      // if everything is ok, put date in state
      this.setState({ selectedDate: selectedDate });
      this.updateProperty(this.props.propertyName, selectedDate);
    }
  };

  /**
   * checks if date is of valid date format
   */
  validateDate = (date: Date): boolean => {
    const dateFormat =
      this.props.widgetProperties.version === 2
        ? ISO_DATE_FORMAT
        : this.props.widgetProperties.dateFormat || ISO_DATE_FORMAT;
    return date ? moment(date, dateFormat).isValid() : true;
  };

  formatDate = (date: Date): string => {
    const dateFormat =
      this.props.widgetProperties.dateFormat || ISO_DATE_FORMAT;
    return moment(date).format(dateFormat);
  };

  parseDate = (dateStr: string): Date | null => {
    if (!dateStr) {
      return null;
    } else {
      const dateFormat =
        this.props.widgetProperties.version === 2
          ? ISO_DATE_FORMAT
          : this.props.widgetProperties.dateFormat || ISO_DATE_FORMAT;
      const date = moment(dateStr, dateFormat);

      if (date.isValid()) return moment(dateStr, dateFormat).toDate();
      else return moment().toDate();
    }
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
