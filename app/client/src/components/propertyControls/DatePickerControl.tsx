import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision } from "@blueprintjs/datetime";
import { WidgetProps } from "widgets/BaseWidget";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import DatePickerComponent from "components/ads/DatePickerComponent";
import { isDynamicValue } from "utils/DynamicBindingUtils";

const DatePickerControlWrapper = styled.div<{ isValid: boolean }>`
  display: flex;
  flex-direction: column;
  margin: 8px 0 0 0;

  &:focus .bp3-input-group input {
    border: 1px solid var(--appsmith-input-focus-border-color);
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
    .set({ month: 11, date: 31, year: this.year + 100 })
    .toDate();
  minDate: Date = this.now
    .clone()
    .set({ month: 0, date: 1, year: this.year - 150 })
    .toDate();

  private wrapperRef = React.createRef<HTMLInputElement>();
  private inputRef = React.createRef<HTMLInputElement>();

  constructor(props: DatePickerControlProps) {
    super(props);
    this.state = {
      selectedDate: props.propertyValue,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeydown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === this.wrapperRef?.current) {
          this.inputRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Escape":
        if (document.activeElement === this.inputRef?.current) {
          this.wrapperRef?.current?.focus();
          e.preventDefault();
        }
        break;
    }
  };

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
      <DatePickerControlWrapper isValid ref={this.wrapperRef} tabIndex={0}>
        <DatePickerComponent
          closeOnSelection
          formatDate={this.formatDate}
          inputRef={this.inputRef}
          maxDate={this.maxDate}
          minDate={this.minDate}
          onChange={this.onDateSelected}
          parseDate={this.parseDate}
          placeholder="YYYY-MM-DD HH:mm"
          showActionsBar
          tabIndex={-1}
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

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }

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
