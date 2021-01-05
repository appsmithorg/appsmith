import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDatePicker } from "./StyledControls";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision } from "@blueprintjs/datetime";
import { WidgetProps } from "widgets/BaseWidget";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

const DatePickerControlWrapper = styled.div<{ isValid: boolean }>`
  display: flex;
  flex-direction: column;
  margin: 8px 0 0 0;
  &&& {
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
  }
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
      <DatePickerControlWrapper isValid={this.props.isValid}>
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

  /**
   * here we put the selected state into state
   * before putting it into state, we check if widget date is in range
   * of property value ( min /max range )
   *
   * @param date
   */
  onDateSelected = (date: Date): void => {
    const selectedDate = date ? this.formatDate(date) : undefined;
    const isValid = this.validateDate(date);

    if (!isValid) return;

    // if everything is ok, put date in state
    this.setState({ selectedDate: selectedDate });
    this.updateProperty(this.props.propertyName, selectedDate);
  };

  /**
   * checks:
   * 1. if max date is greater than the default date
   * 2. if default date is in range of min and max date
   */
  validateDate = (date: Date): boolean => {
    const parsedSelectedDate = moment(
      date,
      this.props.widgetProperties.dateFormat,
    );

    if (this.props.widgetProperties?.evaluatedValues?.value) {
      const parsedWidgetDate = moment(
        this.props.widgetProperties.evaluatedValues.value,
        this.props.widgetProperties.dateFormat,
      );

      // checking if widget date is after min date
      if (this.props.propertyName === "minDate") {
        if (
          parsedSelectedDate.isValid() &&
          parsedWidgetDate.isBefore(parsedSelectedDate)
        ) {
          Toaster.show({
            text: "Min date cannot be greater than current widget value.",
            variant: Variant.danger,
          });

          return false;
        }
      }

      // checking if widget date is before max date
      if (this.props.propertyName === "maxDate") {
        if (
          parsedSelectedDate.isValid() &&
          parsedWidgetDate.isAfter(parsedSelectedDate)
        ) {
          Toaster.show({
            text: "Max date cannot be less than current widget value.",
            variant: Variant.danger,
          });

          return false;
        }
      }
    }

    return true;
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
