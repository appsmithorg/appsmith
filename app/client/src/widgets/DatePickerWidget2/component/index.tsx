import React from "react";
import styled from "styled-components";
import { IntentColors } from "constants/DefaultTheme";
import type { IRef, Alignment } from "@blueprintjs/core";
import { ControlGroup, Classes } from "@blueprintjs/core";
import type { ComponentProps } from "widgets/BaseComponent";
import { DateInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import type { DatePickerType } from "../constants";
import { TimePrecision } from "../constants";
import type { TextSize } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  createMessage,
  DATE_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "@appsmith/constants/messages";
import { LabelPosition } from "components/constants";
import { parseDate } from "./utils";
import { lightenColor, PopoverStyles } from "widgets/WidgetUtils";
import LabelWithTooltip, {
  labelLayoutStyles,
} from "widgets/components/LabelWithTooltip";

const DATEPICKER_POPUP_CLASSNAME = "datepickerwidget-popup";
import { required } from "utils/validation/common";

function hasFulfilledRequiredCondition(
  isRequired: boolean | undefined,
  value: any,
) {
  // if the required condition is not enabled then it has fulfilled
  if (!isRequired) return true;

  return !required(value);
}
const StyledControlGroup = styled(ControlGroup)<{
  isValid: boolean;
  compactMode: boolean;
  labelPosition?: LabelPosition;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
}>`
  ${labelLayoutStyles}

  /**
    When the label is on the left it is not center aligned
    here set height to auto and not 100% because the input 
    has fixed height and stretch the container.
  */
    ${({ labelPosition }) => {
    if (labelPosition === LabelPosition.Left) {
      return `
      height: auto !important;
      align-items: stretch;
      `;
    }
  }}

  &&& {
    .${Classes.INPUT} {
      color: var(--wds-color-text);
      background: var(--wds-color-bg);
      border-radius: ${({ borderRadius }) => borderRadius} !important;
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      border: 1px solid;
      border-color: ${({ isValid }) =>
        !isValid
          ? `var(--wds-color-border-danger);`
          : `var(--wds-color-border);`};
      width: 100%;
      height: 100%;
      min-height: 32px;
      align-items: center;
      transition: none;

      &:active:not(:disabled) {
        border-color: ${({ accentColor, isValid }) =>
          !isValid ? `var(--wds-color-border-danger)` : accentColor};
      }

      &:hover:not(:disabled) {
        border-color: ${({ isValid }) =>
          !isValid
            ? `var(--wds-color-border-danger-hover)`
            : `var(--wds-color-border-hover)`};
      }

      &:focus:not(:disabled) {
        outline: 0;
        border: 1px solid;
        border-color: ${({ accentColor, isValid }) =>
          !isValid
            ? `var(--wds-color-border-danger-focus) !important`
            : accentColor};
        box-shadow: ${({ accentColor, isValid }) =>
          `0px 0px 0px 2px ${
            isValid
              ? lightenColor(accentColor)
              : "var(--wds-color-border-danger-focus-light)"
          } !important;`};
      }
    }

    .${Classes.INPUT}:disabled {
      background: var(--wds-color-bg-disabled);
      color: var(--wds-color-text-disabled);
    }

    .${Classes.INPUT}:not(:disabled)::placeholder {
      color: var(--wds-color-text-light);
    }

    .${Classes.INPUT}::placeholder {
      color: var(--wds-color-text-disabled-light);
    }

    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
    }

    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
  }
  &&& {
    input {
      border: 1px solid;
      border-color: ${(props) =>
        !props.isValid ? IntentColors.danger : Colors.HIT_GRAY};
      box-shadow: none;
      font-size: ${(props) => props.theme.fontSizes[3]}px;
    }
  }
`;

export const DateInputWrapper = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  display: flex;
  &&& {
    flex-grow: 0;
  }
  width: 100%;
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
    // prevProps.selectedDate can undefined and moment(undefined) returns now
    if (
      this.props.selectedDate !== this.state.selectedDate &&
      (!moment(this.props.selectedDate).isSame(
        moment(prevProps.selectedDate),
        "seconds",
      ) ||
        (!prevProps.selectedDate && this.props.selectedDate))
    ) {
      this.setState({ selectedDate: this.props.selectedDate });
    }
  }

  getValidDate = (date: string, format: string) => {
    const _date = moment(date, format);
    return _date.isValid() ? _date.toDate() : undefined;
  };

  getConditionalPopoverProps = (props: DatePickerComponentProps) => {
    if (typeof props.isPopoverOpen === "boolean") {
      return {
        isOpen: props.isPopoverOpen,
      };
    }
    return {};
  };

  render() {
    const {
      compactMode,
      isDisabled,
      isLoading,
      isRequired,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
      labelTooltip,
      labelWidth,
    } = this.props;

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

    const hasFulfilledRequired = hasFulfilledRequiredCondition(
      isRequired,
      value,
    );

    const getInitialMonth = () => {
      // None
      if (
        !this.props.minDate &&
        !this.props.maxDate &&
        !this.state.selectedDate
      ) {
        return new Date();
      }
      // Min-Max-Selcted
      else if (
        this.props.minDate &&
        this.props.maxDate &&
        this.state.selectedDate
      ) {
        switch (true) {
          case new Date(this.props.minDate) > new Date(this.state.selectedDate):
            return new Date(this.props.minDate);
          case new Date(this.props.minDate) < new Date(this.state.selectedDate):
            return isValid
              ? new Date(this.state.selectedDate)
              : new Date(this.props.minDate);
          default:
            return new Date();
        }
      }
      // Min-Max-!Selcted
      else if (
        this.props.minDate &&
        this.props.maxDate &&
        !this.state.selectedDate
      ) {
        switch (true) {
          case new Date(this.props.minDate) > new Date():
          case new Date(this.props.maxDate) < new Date():
            return new Date(this.props.minDate);
          default:
            return new Date();
        }
      }
      // Min-Selcted
      else if (this.props.minDate && this.state.selectedDate) {
        switch (true) {
          case new Date(this.props.minDate) > new Date(this.state.selectedDate):
            return new Date(this.props.minDate);
          case new Date(this.props.minDate) < new Date(this.state.selectedDate):
            return new Date(this.state.selectedDate);
          default:
            return new Date();
        }
      }
      // Max-Selcted
      else if (this.props.maxDate && this.state.selectedDate) {
        switch (true) {
          case new Date(this.props.maxDate) > new Date(this.state.selectedDate):
            return new Date(this.state.selectedDate);
          case new Date(this.props.maxDate) < new Date(this.state.selectedDate):
            return new Date(this.props.maxDate);
          default:
            return new Date();
        }
      }
      // Selected
      else if (this.state.selectedDate) {
        return new Date(this.state.selectedDate);
      }
      // Min
      else if (this.props.minDate) {
        switch (true) {
          case new Date(this.props.minDate) > new Date():
            return new Date(this.props.minDate);
          default:
            return new Date();
        }
      }
      // Max
      else if (this.props.maxDate) {
        switch (true) {
          case new Date(this.props.maxDate) < new Date():
            return new Date(this.props.maxDate);
          default:
            return new Date();
        }
      } else {
        return new Date();
      }
    };
    const initialMonth = getInitialMonth();

    return (
      <StyledControlGroup
        accentColor={this.props.accentColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={this.props.compactMode}
        data-testid="datepicker-container"
        fill
        isValid={isValid && hasFulfilledRequired}
        labelPosition={this.props.labelPosition}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        {labelText && (
          <LabelWithTooltip
            alignment={labelAlignment}
            className={`datepicker-label`}
            color={labelTextColor}
            compact={compactMode}
            cyHelpTextClassName="datepicker-tooltip"
            disabled={isDisabled}
            fontSize={labelTextSize}
            fontStyle={labelStyle}
            helpText={labelTooltip}
            isDynamicHeightEnabled={this.props.isDynamicHeightEnabled}
            loading={isLoading}
            position={labelPosition}
            text={labelText}
            width={labelWidth}
          />
        )}
        <DateInputWrapper
          compactMode={compactMode}
          labelPosition={labelPosition}
        >
          <ErrorTooltip
            isOpen={!isValid}
            message={createMessage(DATE_WIDGET_DEFAULT_VALIDATION_ERROR)}
          >
            <DateInput
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              closeOnSelection={this.props.closeOnSelection}
              dayPickerProps={{
                firstDayOfWeek: this.props.firstDayOfWeek || 0,
              }}
              disabled={this.props.isDisabled}
              formatDate={this.formatDate}
              initialMonth={initialMonth}
              inputProps={{
                inputRef: this.props.inputRef,
                onFocus: () => this.props.onFocus?.(),
                onBlur: () => this.props.onBlur?.(),
              }}
              maxDate={maxDate}
              minDate={minDate}
              onChange={this.onDateSelected}
              parseDate={this.parseDate}
              placeholder={"Select Date"}
              popoverProps={{
                portalContainer:
                  document.getElementById("art-board") || undefined,
                usePortal: !this.props.withoutPortal,
                canEscapeKeyClose: true,
                portalClassName: `${DATEPICKER_POPUP_CLASSNAME}-${this.props.widgetId}`,
                onClose: this.props.onPopoverClosed,
                /* 
                  Conditional popover props are the popover props that should not be sent to
                  DateInput in any way if they are not applicable.
                  Here isOpen prop if sent in any way will interfere with the normal functionality
                  of Date Picker widget's popover but is required for Table Widget's date cell popover
                */
                ...this.getConditionalPopoverProps(this.props),
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
        </DateInputWrapper>
        <PopoverStyles
          accentColor={this.props.accentColor}
          borderRadius={this.props.borderRadius}
          portalClassName={`${DATEPICKER_POPUP_CLASSNAME}-${this.props.widgetId}`}
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
    if (!isValid && this.props?.onDateOutOfRange) {
      this.props.onDateOutOfRange();
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
      const dateFormat = this.props.dateFormat || ISO_DATE_FORMAT;
      return parseDate(dateStr, dateFormat);
    }
  };

  /**
   * checks if selelectedDate is null or not,
   * sets state and calls props onDateSelected
   * if its null, don't call onDateSelected
   * update internal state while changing month/year to update calender
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
  compactMode: boolean;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  dateFormat: string;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  timezone?: string;
  datePickerType: DatePickerType;
  isDisabled: boolean;
  isDynamicHeightEnabled?: boolean;
  onDateSelected: (selectedDate: string) => void;
  isLoading: boolean;
  withoutPortal?: boolean;
  closeOnSelection: boolean;
  shortcuts: boolean;
  firstDayOfWeek?: number;
  timePrecision: TimePrecision;
  inputRef?: IRef<HTMLInputElement>;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
  labelTooltip?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onPopoverClosed?: (e: unknown) => void;
  isPopoverOpen?: boolean;
  onDateOutOfRange?: () => void;
  isRequired?: boolean;
}

interface DatePickerComponentState {
  selectedDate?: string;
}

export default DatePickerComponent;
