import React from "react";
import styled from "styled-components";
import { labelStyle } from "constants/DefaultTheme";
import { ControlGroup, Classes, Label } from "@blueprintjs/core";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { DateInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType } from "widgets/DatePickerWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { TimePrecision } from "@blueprintjs/datetime";
import { Colors } from "constants/Colors";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    .${Classes.INPUT} {
      box-shadow: none;
      border: 1px solid;
      border-color: ${Colors.GEYSER_LIGHT};
      border-radius: ${(props) => props.theme.radii[1]}px;
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
      border-radius: ${(props) => props.theme.radii[1]}px;
      box-shadow: none;
      color: ${Colors.OXFORD_BLUE};
      font-size: ${(props) => props.theme.fontSizes[3]}px;
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
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
    if (
      this.props.selectedDate !== this.state.selectedDate &&
      !moment(this.props.selectedDate, dateFormat).isSame(
        moment(prevProps.selectedDate, dateFormat),
        "seconds",
      )
    ) {
      this.setState({ selectedDate: this.props.selectedDate });
    }
  }
  getValidDate = (date: string, format: string) => {
    const _date = moment(date, format);
    return _date.isValid() ? _date.toDate() : undefined;
  };

  render() {
    const now = moment();
    const year = now.get("year");
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
    const minDate = this.props.minDate
      ? this.getValidDate(this.props.minDate, dateFormat)
      : now
          .clone()
          .set({ month: 0, date: 1, year: year - 100 })
          .toDate();
    const maxDate = this.props.maxDate
      ? this.getValidDate(this.props.maxDate, dateFormat)
      : now
          .clone()
          .set({ month: 11, date: 31, year: year + 20 })
          .toDate();

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
        {
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
                ? this.parseDate(this.state.selectedDate)
                : null
            }
            minDate={minDate}
            maxDate={maxDate}
          />
        }
      </StyledControlGroup>
    );
  }

  formatDate = (date: Date): string => {
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
    return moment(date).format(dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
    const date = moment(dateStr, dateFormat);

    if (date.isValid()) return moment(dateStr, dateFormat).toDate();
    else return moment().toDate();
  };

  /**
   * checks if selelectedDate is null or not,
   * sets state and calls props onDateSelected
   * if its null, don't call onDateSelected
   *
   * @param selectedDate
   */
  onDateSelected = (selectedDate: Date, isUserChange: boolean) => {
    if (isUserChange) {
      const { onDateSelected } = this.props;

      const date = selectedDate ? this.formatDate(selectedDate) : "";
      this.setState({ selectedDate: date });

      // if date is null ( if date is cleared ), don't call onDateSelected
      if (!selectedDate) return false;

      onDateSelected(date);
    }
  };
}

interface DatePickerComponentProps extends ComponentProps {
  label: string;
  dateFormat: string;
  enableTimePicker?: boolean;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  timezone?: string;
  datePickerType: DatePickerType;
  isDisabled: boolean;
  onDateSelected: (selectedDate: string) => void;
  isLoading: boolean;
}

interface DatePickerComponentState {
  selectedDate?: string;
}

export default DatePickerComponent;
