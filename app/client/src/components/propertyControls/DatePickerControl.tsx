import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledDatePicker,
  StyledTimeZonePicker,
  StyledSwitch,
} from "./StyledControls";
import moment from "moment-timezone";
import "../../../node_modules/@blueprintjs/timezone/lib/css/blueprint-timezone.css";
import styled from "styled-components";
import { TIMEZONE, ENABLE_TIME } from "constants/messages";
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

const LabelWrapper = styled.div`
  color: ${props => props.theme.colors.paneText};
  margin-bottom: 4px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  margin-top: 10px;
`;

type DatePickerContorlState = {
  date: Date;
  dateValue: number;
  isTimeEnabled: boolean;
  timezone: string;
};

class DatePickerControl extends BaseControl<
  DatePickerControlProps,
  DatePickerContorlState
> {
  constructor(props: DatePickerControlProps) {
    super(props);
    const timezone =
      this.props.propertyValue && this.props.propertyValue.timezone
        ? this.props.propertyValue.timezone
        : moment.tz.guess();
    const isTimeEnabled =
      this.props.propertyValue && this.props.propertyValue.isTimeEnabled
        ? this.props.propertyValue.isTimeEnabled
        : false;
    const dateValue =
      this.props.propertyValue && this.props.propertyValue.dateValue
        ? this.props.propertyValue.dateValue
        : new Date().getTime();
    const offset = this.getOffset(timezone, dateValue);
    const date = new Date(dateValue + offset);
    this.state = {
      date,
      timezone,
      dateValue,
      isTimeEnabled,
    };
  }

  componentDidMount() {
    const timezone =
      this.props.propertyValue && this.props.propertyValue.timezone
        ? this.props.propertyValue.timezone
        : moment.tz.guess();
    const isTimeEnabled =
      this.props.propertyValue && this.props.propertyValue.isTimeEnabled
        ? this.props.propertyValue.isTimeEnabled
        : false;
    const dateValue =
      this.props.propertyValue && this.props.propertyValue.dateValue
        ? this.props.propertyValue.dateValue
        : new Date().getTime();
    const offset = this.getOffset(timezone, dateValue);
    const date = new Date(dateValue + offset);
    this.setState({
      date,
      timezone,
      dateValue,
      isTimeEnabled,
    });
  }

  getOffset = (timezone: string, timeStamp: number) => {
    return moment.tz.zone(timezone)!.utcOffset(timeStamp) * 60 * 1000;
  };

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
          placeholder="DD/MM/YYYY"
          showActionsBar
          timePrecision={
            this.state.isTimeEnabled ? TimePrecision.MINUTE : undefined
          }
          closeOnSelection
          onChange={this.onDateSelected}
          maxDate={maxDate.toDate()}
          minDate={minDate.toDate()}
          value={this.state.date}
        />
        <LabelWrapper>{TIMEZONE}</LabelWrapper>
        <StyledTimeZonePicker
          onChange={this.onTimeZoneSelected}
          valueDisplayFormat="composite"
          showLocalTimezone
          value={this.state.timezone || moment.tz.guess()}
        />
        <LabelWrapper>{ENABLE_TIME}</LabelWrapper>
        <StyledSwitch
          onChange={this.onToggle}
          checked={this.state.isTimeEnabled}
          large
        />
      </DatePickerControlWrapper>
    );
  }

  onToggle = () => {
    const { isTimeEnabled } = this.state;
    this.setState({ isTimeEnabled: !isTimeEnabled }, () => {
      this.updatePropertyValue();
    });
  };

  onTimeZoneSelected = (timezone: string): void => {
    const { dateValue } = this.state;
    const offset = this.getOffset(timezone, dateValue);
    const dateVisible = new Date(dateValue + offset);
    this.setState({ timezone: timezone, date: dateVisible }, () => {
      this.updatePropertyValue();
    });
  };

  onDateSelected = (date: Date): void => {
    const { timezone } = this.state;
    const offset = this.getOffset(timezone, date.getTime());
    const dateValue = new Date(date.getTime() - offset).getTime();
    this.setState({ date: date, dateValue: dateValue }, () => {
      this.updatePropertyValue();
    });
  };

  updatePropertyValue = () => {
    const { dateValue, isTimeEnabled, timezone } = this.state;
    this.updateProperty(this.props.propertyName, {
      timezone: timezone,
      dateValue: dateValue,
      isTimeEnabled: isTimeEnabled,
    });
  };

  formatDate = (date: Date): string => {
    let dateFormat = "DD/MM/YYYY";
    if (this.state.isTimeEnabled) {
      dateFormat = "DD/MM/YYYY HH:mm";
    }
    return moment(date).format(dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    const date = moment(dateStr).toDate();
    return date;
  };

  static getControlType() {
    return "DATE_PICKER";
  }
}

export interface DatePickerControlProps extends ControlProps {
  placeholderText: string;
  propertyValue: {
    timezone: string;
    dateValue: number;
    isTimeEnabled: boolean;
  };
}

export default DatePickerControl;
