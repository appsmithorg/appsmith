import React from "react";
import styled from "styled-components";
import { IntentColors, getBorderCSSShorthand } from "constants/DefaultTheme";
import {
  ControlGroup,
  Classes,
  Label,
  Alignment,
  Position,
} from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { DateInput } from "@blueprintjs/datetime";
import moment from "moment-timezone";
import "../../../../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import { DatePickerType, TimePrecision } from "../constants";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  createMessage,
  DATE_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";
import {
  LabelPosition,
  LabelPositionTypes,
  LABEL_MAX_WIDTH_RATE,
} from "components/constants";
import Tooltip from "components/ads/Tooltip";

const StyledControlGroup = styled(ControlGroup)<{
  isValid: boolean;
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  display: flex;
  flex-direction: ${(props) =>
    props.labelPosition === LabelPositionTypes.Left
      ? "row"
      : props.labelPosition === LabelPositionTypes.Top
      ? "column"
      : props.compactMode
      ? "row"
      : "column"};
  align-items: ${({ compactMode, labelPosition }) =>
    labelPosition === LabelPositionTypes.Top
      ? `flex-start`
      : compactMode || labelPosition === LabelPositionTypes.Left
      ? `center`
      : `flex-start`};
  ${({ compactMode, labelPosition }) =>
    ((labelPosition !== LabelPositionTypes.Left && !compactMode) ||
      labelPosition === LabelPositionTypes.Top) &&
    `overflow-x: hidden; overflow-y: auto;`}

  label.datepicker-label {
    ${({ compactMode, labelPosition }) =>
      labelPosition === LabelPositionTypes.Top
        ? `margin-bottom: 5px; margin-right: 0px`
        : compactMode || labelPosition === LabelPositionTypes.Left
        ? `margin-bottom: 0px; margin-right: 5px`
        : `margin-bottom: 5px; margin-right: 0px`};
  }
  &&& {
    .${Classes.INPUT} {
      color: ${Colors.GREY_10};
      box-shadow: none;
      border: 1px solid;
      border-color: ${(props) =>
        !props.isValid ? IntentColors.danger : Colors.GEYSER_LIGHT};
      width: 100%;
      height: inherit;
      align-items: center;
      &:active {
        border-color: ${({ isValid }) =>
          !isValid ? IntentColors.danger : Colors.HIT_GRAY};
      }
      &:focus {
        border-color: ${({ isValid }) =>
          !isValid ? IntentColors.danger : Colors.MYSTIC};

        &:focus {
          border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
        }
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

export const TextLabelWrapper = styled.div<{
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}>`
  display: flex;
  ${({ alignment, compactMode, position, width }) => `
    ${
      position !== LabelPositionTypes.Top &&
      (position === LabelPositionTypes.Left || compactMode)
        ? `&&& {margin-right: 5px; flex-shrink: 0;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `&&& {flex:0; width: 100%;}`
    }
    ${position === LabelPositionTypes.Left &&
      `${width && `width: ${width}px`}; ${alignment === Alignment.RIGHT &&
        `justify-content:  flex-end`};`}
  `}
`;

export const StyledLabel = styled(Label)<{
  $disabled: boolean;
  $labelText?: string;
  $labelTextColor?: string;
  $labelTextSize?: TextSize;
  $labelStyle?: string;
  disabled?: boolean;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  text-align: left;
  color: ${(props) =>
    props.disabled ? Colors.GREY_8 : props.$labelTextColor || "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;

export const DateInputWrapper = styled.div`
  display: flex;
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
      hasLabelEllipsis: false,
    };
  }

  componentDidMount() {
    this.setState({ hasLabelEllipsis: this.checkHasLabelEllipsis() });
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

    if (
      prevProps.width !== this.props.width ||
      prevProps.labelText !== this.props.labelText ||
      prevProps.labelPosition !== this.props.labelPosition ||
      prevProps.labelWidth !== this.props.labelWidth
    ) {
      this.setState({ hasLabelEllipsis: this.checkHasLabelEllipsis() });
    }
  }

  checkHasLabelEllipsis = () => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${this.props.widgetId} .datepicker-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  };

  getValidDate = (date: string, format: string) => {
    const _date = moment(date, format);
    return _date.isValid() ? _date.toDate() : undefined;
  };

  render() {
    const {
      compactMode,
      isDisabled,
      isLoading,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
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
    return (
      <StyledControlGroup
        compactMode={this.props.compactMode}
        fill
        isValid={isValid}
        labelPosition={this.props.labelPosition}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        {labelText && (
          <TextLabelWrapper
            alignment={labelAlignment}
            compactMode={compactMode}
            position={labelPosition}
            width={labelWidth}
          >
            {this.state.hasLabelEllipsis ? (
              <StyledTooltip
                content={labelText}
                hoverOpenDelay={200}
                position={Position.TOP}
              >
                <StyledLabel
                  $disabled={isDisabled}
                  $labelStyle={labelStyle}
                  $labelText={labelText}
                  $labelTextColor={labelTextColor}
                  $labelTextSize={labelTextSize}
                  className={`datepicker-label ${
                    isLoading
                      ? Classes.SKELETON
                      : Classes.TEXT_OVERFLOW_ELLIPSIS
                  }`}
                  disabled={isDisabled}
                >
                  {labelText}
                </StyledLabel>
              </StyledTooltip>
            ) : (
              <StyledLabel
                $disabled={isDisabled}
                $labelStyle={labelStyle}
                $labelText={labelText}
                $labelTextColor={labelTextColor}
                $labelTextSize={labelTextSize}
                className={`datepicker-label ${
                  isLoading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
                }`}
                disabled={isDisabled}
              >
                {labelText}
              </StyledLabel>
            )}
          </TextLabelWrapper>
        )}
        <DateInputWrapper>
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
              maxDate={maxDate}
              minDate={minDate}
              onChange={this.onDateSelected}
              parseDate={this.parseDate}
              placeholder={"Select Date"}
              popoverProps={{
                usePortal: !this.props.withoutPortal,
                canEscapeKeyClose: true,
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
   * update internal state while changing month/year to update calender
   *
   * @param selectedDate
   */
  onDateSelected = (selectedDate: Date | null, isUserChange: boolean) => {
    const { onDateSelected } = this.props;
    const date = selectedDate ? selectedDate.toISOString() : "";
    this.setState({ selectedDate: date });
    if (isUserChange) {
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
  onDateSelected: (selectedDate: string) => void;
  isLoading: boolean;
  withoutPortal?: boolean;
  closeOnSelection: boolean;
  shortcuts: boolean;
  firstDayOfWeek?: number;
  timePrecision: TimePrecision;
  width?: number;
}

interface DatePickerComponentState {
  selectedDate?: string;
  hasLabelEllipsis: boolean;
}

export default DatePickerComponent;
