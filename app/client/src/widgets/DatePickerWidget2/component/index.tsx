import React from "react";
import styled from "styled-components";
import { labelStyle } from "constants/DefaultTheme";
import { ControlGroup, Classes, Label } from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { DateInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType, TimePrecision } from "../constants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  createMessage,
  DATE_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";
import { lightenColor, PopoverStyles } from "widgets/WidgetUtils";

const DATEPICKER_POPUP_CLASSNAME = "datepickerwidget-popup";

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */
const StyledControlGroup = styled(ControlGroup)<{
  isValid: boolean;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  primaryColor: string;
}>`
  & {
    .${Classes.INPUT} {
      color: ${Colors.GREY_10};
      background: ${({ backgroundColor }) =>
        `${backgroundColor || Colors.WHITE}`};
      border-radius: ${({ borderRadius }) => borderRadius} !important;
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      border: 1px solid;
      border-color: ${({ isValid }) =>
        !isValid ? `${Colors.DANGER_SOLID} !important;` : `${Colors.GREY_3};`}
      width: 100%;
      height: 100%;
      align-items: center;
      &:active {
        border-color: ${({ isValid, primaryColor }) =>
          !isValid ? Colors.DANGER_SOLID : primaryColor};
      }
      &:focus {
        outline: 0;
        border: 1px solid;
        border-color: ${({ isValid, primaryColor }) =>
          !isValid ? Colors.DANGER_SOLID : primaryColor};
        box-shadow: ${({ primaryColor }) =>
          `0px 0px 0px 2px ${lightenColor(primaryColor)} !important;`}
      }
    }
    .${Classes.INPUT}:disabled {
      background: ${Colors.GREY_1};
      color: ${Colors.GREY_7};
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
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
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
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        fill
        isValid={isValid}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
        primaryColor={this.props.primaryColor}
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
              closeOnSelection={this.props.closeOnSelection}
              disabled={this.props.isDisabled}
              formatDate={this.formatDate}
              maxDate={maxDate}
              minDate={minDate}
              onChange={this.onDateSelected}
              parseDate={this.parseDate}
              placeholder={"Select Date"}
              popoverProps={{
                usePortal: !this.props.withoutPortal,
                canEscapeKeyClose: true,
                portalClassName: `${DATEPICKER_POPUP_CLASSNAME}-${this.props.widgetId}`,
              }}
              shortcuts={this.props.shortcuts}
              showActionsBar
              timePrecision={
                this.props.timePrecision === TimePrecision.NONE
                  ? undefined
                  : this.props.timePrecision
              }
              value={value}
            />
          </ErrorTooltip>
        }
        <PopoverStyles
          borderRadius={this.props.borderRadius}
          portalClassName={`${DATEPICKER_POPUP_CLASSNAME}-${this.props.widgetId}`}
          primaryColor={this.props.primaryColor}
        />
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

  parseDate = (dateStr: string): Date | null => {
    //when user clears date field the value of dateStr will be empty
    //and that means user is clearing date field
    if (!dateStr) {
      return null;
    } else {
      const date = moment(dateStr);
      const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
      if (date.isValid()) return moment(dateStr, dateFormat).toDate();
      else return moment().toDate();
    }
  };

  /**
   * checks if selelectedDate is null or not,
   * sets state and calls props onDateSelected
   * if its null, don't call onDateSelected
   *
   * @param selectedDate
   */
  onDateSelected = (selectedDate: Date | null, isUserChange: boolean) => {
    if (isUserChange) {
      const { onDateSelected } = this.props;
      const date = selectedDate ? selectedDate.toISOString() : "";
      this.setState({
        selectedDate: date,
      });
      onDateSelected(date);
    }
  };
}

interface DatePickerComponentProps extends ComponentProps {
  label: string;
  dateFormat: string;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  timezone?: string;
  datePickerType: DatePickerType;
  isDisabled: boolean;
  onDateSelected: (selectedDate: string) => void;
  isLoading: boolean;
  withoutPortal?: boolean;
  closeOnSelection: boolean;
  shortcuts: boolean;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  primaryColor: string;
  timePrecision: TimePrecision;
}

interface DatePickerComponentState {
  selectedDate?: string;
}

export default DatePickerComponent;
