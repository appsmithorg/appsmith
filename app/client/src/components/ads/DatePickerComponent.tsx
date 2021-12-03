import React from "react";
import { DateInput, TimePrecision } from "@blueprintjs/datetime";
import styled from "constants/DefaultTheme";
import { Classes } from "./common";
import { Colors } from "constants/Colors";

const StyledDateInput = styled(DateInput)`
  & {
    input {
      color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
      background-color: ${(props) =>
        props.theme.colors.propertyPane.buttonText};
      border: 1px solid ${Colors.ALTO2};
      border-radius: 0;
      padding: 0px 8px;
      height: 32px;
      box-shadow: none;

      &:focus {
        box-shadow: none;
      }
    }
  }

  .${Classes.DATE_PICKER_OVARLAY} {
    background-color: ${(props) =>
      props.theme.colors.propertyPane.radioGroupBg};
    color: ${(props) => props.theme.colors.propertyPane.buttonBg};
    box-shadow: 0px 12px 28px -8px rgba(0, 0, 0, 0.75);
    margin-top: -3px;

    .DayPicker-Day,
    .bp3-datepicker-day-wrapper,
    .DayPicker-Day.DayPicker-Day--selected,
    .DayPicker-Day--today.bp3-datepicker-day-wrapper {
      border-radius: 0;
      border: none;

      &&&&&&.bp3-datepicker-day-wrapper {
        border: none;
      }
    }

    .DayPicker-Day--today {
      background-color: ${(props) =>
        props.theme.colors.propertyPane.zoomButtonBG};
      .bp3-datepicker-day-wrapper.bp3-datepicker-day-wrapper {
        border: none;
      }
    }

    .DayPicker-Day.DayPicker-Day--selected,
    .DayPicker-Day.DayPicker-Day--selected:hover {
      background-color: ${(props) =>
        props.theme.colors.propertyPane.activeButtonText};
      font-weight: 500;
      letter-spacing: 0.4px;
    }

    .bp3-timepicker-input-row {
      height: 35px;
      width: 110px;
      box-shadow: none;
      border-radius: 0;
      border: none;
      background-color: ${(props) =>
        props.theme.colors.propertyPane.zoomButtonBG};
      margin-bottom: 5px;

      .bp3-timepicker-input {
        color: inherit;
        box-shadow: none;
        width: 50px;
        height: 100%;
      }
    }

    .DayPicker-Day.DayPicker-Day--outside {
      color: ${(props) => props.theme.colors.propertyPane.jsIconBg};
    }
  }
`;

export const TimePrecisions = {
  MILLISECOND: TimePrecision.MILLISECOND,
  SECOND: TimePrecision.SECOND,
  MINUTE: TimePrecision.MINUTE,
};

interface DatePickerComponentProps {
  maxDate: Date;
  minDate: Date;
  placeholder: string;
  showActionsBar?: boolean;
  timePrecision?: TimePrecision;
  closeOnSelection?: boolean;
  highlightCurrentDay?: boolean;
  value: Date | null;
  onChange?: (selectedDate: Date, isUserChange: boolean) => void;
  formatDate?: (date: Date) => string;
  parseDate?: (dateStr: string) => Date | null;
}

function DatePickerComponent(props: DatePickerComponentProps) {
  return (
    <StyledDateInput
      className={Classes.DATE_PICKER_OVARLAY}
      closeOnSelection={props.closeOnSelection}
      formatDate={props.formatDate}
      highlightCurrentDay={props.highlightCurrentDay}
      maxDate={props.maxDate}
      minDate={props.minDate}
      onChange={props.onChange}
      parseDate={props.parseDate}
      placeholder={props.placeholder}
      popoverProps={{ usePortal: true }}
      showActionsBar={props.showActionsBar}
      timePrecision={props.timePrecision}
      value={props.value}
    />
  );
}

DatePickerComponent.defaultProps = {
  highlightCurrentDay: true,
};

export default DatePickerComponent;
