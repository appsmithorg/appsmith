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

class DatePickerComponent extends React.Component<
  DatePickerComponentProps,
  DatePickerComponentState
> {
  constructor(props: DatePickerComponentProps) {
    super(props);
    this.state = {
      selectedDate: props.selectedDate,
    };
  }

  componentDidUpdate(prevProps: DatePickerComponentProps) {
    if (
      this.props.selectedDate !== this.state.selectedDate &&
      !moment(this.props.selectedDate).isSame(
        moment(prevProps.selectedDate),
        "seconds",
      )
    ) {
      this.setState({ selectedDate: this.props.selectedDate });
    }
  }

  render() {
    const now = moment();
    const year = now.get("year");
    const minDate = now.clone().set({ month: 0, date: 1, year: year - 100 });
    const maxDate = now.clone().set({ month: 11, date: 31, year: year + 5 });
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
            placeholder={"Select Date"}
            disabled={this.props.isDisabled}
            showActionsBar={true}
            timePrecision={TimePrecision.MINUTE}
            closeOnSelection
            onChange={this.onDateSelected}
            value={
              this.state.selectedDate
                ? moment(this.state.selectedDate).toDate()
                : null
            }
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

  formatDate = (date: Date): string => {
    return moment(date).format(this.props.dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    return moment(dateStr).toDate();
  };

  onDateSelected = (selectedDate: Date) => {
    const date = selectedDate
      ? moment(selectedDate).format(this.props.dateFormat)
      : "";
    this.setState({ selectedDate: date });
    this.props.onDateSelected(date);
  };
}

interface DatePickerComponentProps extends ComponentProps {
  label: string;
  dateFormat: string;
  enableTimePicker?: boolean;
  selectedDate: string;
  minDate?: Date;
  maxDate?: Date;
  timezone?: string;
  datePickerType: DatePickerType;
  isDisabled: boolean;
  onDateSelected: (selectedDate: string) => void;
  isLoading: boolean;
}

interface DatePickerComponentState {
  selectedDate: string;
}

export default DatePickerComponent;
