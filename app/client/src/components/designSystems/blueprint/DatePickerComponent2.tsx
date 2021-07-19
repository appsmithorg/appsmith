import React from "react";
import styled from "styled-components";
import { labelStyle, IntentColors } from "constants/DefaultTheme";
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
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  createMessage,
  DATE_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";

const StyledControlGroup = styled(ControlGroup)<{ isValid: boolean }>`
  &&& {
    .${Classes.INPUT} {
      box-shadow: none;
      border: 1px solid;
      border-color: ${(props) =>
        !props.isValid ? IntentColors.danger : Colors.GEYSER_LIGHT};
      border-radius: ${(props) => props.theme.radii[1]}px;
      width: 100%;
      height: inherit;
      align-items: center;
      &:active {
        border-color: ${(props) =>
          !props.isValid ? IntentColors.danger : Colors.HIT_GRAY};
      }
      &:focus {
        border-color: ${(props) =>
          !props.isValid ? IntentColors.danger : Colors.MYSTIC};
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
      border: 1px solid;
      border-color: ${(props) =>
        !props.isValid ? IntentColors.danger : Colors.HIT_GRAY};
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
      showPicker: false,
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

  getValidDate = (date: string, format: string) => {
    const _date = moment(date, format);
    return _date.isValid() ? _date.toDate() : undefined;
  };

  render() {
    const now = moment();
    const year = now.get("year");
    const minDate = this.props.minDate
      ? new Date(this.props.minDate)
      : now
          .clone()
          .set({ month: 0, date: 1, year: year - 100 })
          .toDate();
    const maxDate = this.props.maxDate
      ? new Date(this.props.maxDate)
      : now
          .clone()
          .set({ month: 11, date: 31, year: year + 100 })
          .toDate();
    const isValid = this.state.selectedDate
      ? this.isValidDate(new Date(this.state.selectedDate))
      : true;
    const value =
      isValid && this.state.selectedDate
        ? new Date(this.state.selectedDate)
        : null;
    return (
      <StyledControlGroup
        fill
        isValid={isValid}
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
          <ErrorTooltip
            isOpen={!isValid}
            message={createMessage(DATE_WIDGET_DEFAULT_VALIDATION_ERROR)}
          >
            <DateInput
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              disabled={this.props.isDisabled}
              formatDate={this.formatDate}
              inputProps={{
                onFocus: this.showPicker,
              }}
              maxDate={maxDate}
              minDate={minDate}
              onChange={this.onDateSelected}
              parseDate={this.parseDate}
              placeholder={"Select Date"}
              popoverProps={{
                isOpen: this.state.showPicker,
                onClose: this.closePicker,
              }}
              shortcuts={this.props.shortcuts}
              showActionsBar
              timePrecision={TimePrecision.MINUTE}
              value={value}
            />
          </ErrorTooltip>
        }
      </StyledControlGroup>
    );
  }

  isValidDate = (date: Date): boolean => {
    let isValid = true;
    const parsedCurrentDate = moment(date);
    if (this.props.minDate) {
      const parsedMinDate = moment(this.props.minDate);
      if (
        this.props.minDate &&
        parsedMinDate.isValid() &&
        !parsedCurrentDate.isSame(parsedMinDate, "day") &&
        parsedCurrentDate.isBefore(parsedMinDate)
      ) {
        isValid = false;
      }
    }
    if (this.props.maxDate) {
      const parsedMaxDate = moment(this.props.maxDate);
      if (
        isValid &&
        this.props.maxDate &&
        parsedMaxDate.isValid() &&
        !parsedCurrentDate.isSame(parsedMaxDate, "day") &&
        parsedCurrentDate.isAfter(parsedMaxDate)
      ) {
        isValid = false;
      }
    }
    return isValid;
  };

  formatDate = (date: Date): string => {
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
    return moment(date).format(dateFormat);
  };

  parseDate = (dateStr: string): Date => {
    const date = moment(dateStr);
    const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
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
      const { closeOnSelection, onDateSelected } = this.props;

      const date = selectedDate ? selectedDate.toISOString() : "";
      this.setState({
        selectedDate: date,
        // close picker while user changes in calender
        // if closeOnSelection false, do not allow user to close picker
        showPicker: !closeOnSelection,
      });

      onDateSelected(date);
    }
  };

  showPicker = () => {
    this.setState({ showPicker: true });
  };

  closePicker = (e: any) => {
    const { closeOnSelection } = this.props;
    try {
      // check user click on shortcuts or out side widget
      const $parent = document.getElementsByClassName(
        "bp3-daterangepicker-shortcuts",
      )[0];
      // user click shortcuts, follow closeOnSelection behaviour otherwise close picker
      const showPicker = $parent.contains(e.target) ? !closeOnSelection : false;
      this.setState({ showPicker });
    } catch (error) {
      this.setState({ showPicker: false });
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
  closeOnSelection: boolean;
  shortcuts: boolean;
}

interface DatePickerComponentState {
  selectedDate?: string;
  showPicker?: boolean;
}

export default DatePickerComponent;
