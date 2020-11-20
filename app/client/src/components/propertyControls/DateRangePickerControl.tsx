import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDateRangePicker } from "./StyledControls";
import moment from "moment-timezone";
import styled from "styled-components";
import { TimePrecision, DateRange } from "@blueprintjs/datetime";
import { WidgetProps } from "widgets/BaseWidget";

const DateRangePickerControlWrapper = styled.div`
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

  .bp3-control-group {
    display: block;
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

class DateRangePickerControl extends BaseControl<
  DateRangePickerControlProps,
  DateRangePickerControlState
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

  constructor(props: DateRangePickerControlProps) {
    super(props);
    this.state = {
      selectedDates: props.propertyValue,
    };
  }

  render() {
    return (
      <DateRangePickerControlWrapper>
        <StyledDateRangePicker
          formatDate={this.formatDate}
          parseDate={this.parseDate}
          singleMonthOnly
          shortcuts={false}
          // placeholder="DD/MM/YYYY HH:mm"
          timePrecision={TimePrecision.MINUTE}
          closeOnSelection
          onChange={this.onDateSelected}
          maxDate={this.maxDate}
          minDate={this.minDate}
          value={this.parseDates(this.props.propertyValue)}
        />
      </DateRangePickerControlWrapper>
    );
  }

  onDateSelected = (dates: DateRange | undefined): void => {
    const selectedDates = dates?.map(date => {
      if (date) return this.formatDate(date);

      return null;
    });

    this.setState({ selectedDates });
    this.updateProperty(this.props.propertyName, selectedDates);
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

  parseDates = (dates: (string | null)[]): DateRange => {
    const parsedDates: DateRange = [null, null];

    console.log({ dates });

    if (Array.isArray(dates)) {
      dates.map((date, index) => {
        if (date) {
          parsedDates[index] = this.parseDate(date);
        }
      });
    }

    return parsedDates;
  };

  static getControlType() {
    return "DATE_RANGE_PICKER";
  }
}

export interface DateRangePickerControlProps extends ControlProps {
  placeholderText: string;
  propertyValue: (string | null)[];
  widgetProperties: WidgetProps;
}

interface DateRangePickerControlState {
  selectedDates?: (string | null)[];
}

export default DateRangePickerControl;
