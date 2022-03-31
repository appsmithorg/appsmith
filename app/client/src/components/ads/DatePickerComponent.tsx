import React, { useEffect, useRef, useState } from "react";
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

  button,
  select,
  [tabindex]:not([tabindex="-1"]) {
    &:focus {
      outline: #6eb9f0 auto 2px !important;
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

function getKeyboardFocusableElements(element: HTMLDivElement) {
  return [
    ...element.querySelectorAll(
      'button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );
}

function DatePickerComponent(props: DatePickerComponentProps) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(null);

  function handleDateInputClick() {
    setDatePickerVisibility(true);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (document.activeElement === inputRef.current) {
      if (e.key === "Enter") {
        setDatePickerVisibility(true);
      } else if (e.key === "Escape") {
        setDatePickerVisibility(false);
      } else if (e.key === "Tab") {
        const popoverElement = popoverRef.current;
        if (popoverElement) {
          e.preventDefault();
          const focusableElements = getKeyboardFocusableElements(
            popoverElement,
          );
          const firstElement = focusableElements[0];
          if (firstElement) {
            (firstElement as any)?.focus();
          }
        }
      }
    } else {
      const popoverElement = popoverRef.current;
      if (popoverElement) {
        const focusableElements = getKeyboardFocusableElements(popoverElement);
        if (
          focusableElements.some(
            (element) => document.activeElement === element,
          )
        ) {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setDatePickerVisibility(false);
          }
        }
      }
    }
  }

  function handleDocumentClick(e: Event) {
    if (popoverRef.current) {
      if (popoverRef.current.contains(e.target as Node)) {
        const $footerBar = popoverRef.current.querySelector(
          ".bp3-datepicker-footer",
        );
        if ($footerBar) {
          const $buttons = Array.from(
            $footerBar.querySelectorAll("button.bp3-button"),
          );
          if ($buttons.some((button) => button.contains(e.target as Node))) {
            setDatePickerVisibility(false);
          }
        }
      }
    }
  }

  useEffect(() => {
    document.body.addEventListener("keydown", handleKeydown);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.body.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  function handleOnDayClick() {
    setDatePickerVisibility(false);
  }

  function handleInteraction(nextOpenState: boolean) {
    setDatePickerVisibility(nextOpenState);
  }

  function handleTimePickerKeydown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      setDatePickerVisibility(false);
      e.stopPropagation();
    }
  }

  return (
    <StyledDateInput
      className={Classes.DATE_PICKER_OVARLAY}
      closeOnSelection={props.closeOnSelection}
      dayPickerProps={{ onDayClick: handleOnDayClick }}
      formatDate={props.formatDate}
      highlightCurrentDay={props.highlightCurrentDay}
      inputProps={{
        inputRef: inputRef,
        onClick: handleDateInputClick,
      }}
      maxDate={props.maxDate}
      minDate={props.minDate}
      onChange={props.onChange}
      parseDate={props.parseDate}
      placeholder={props.placeholder}
      popoverProps={{
        popoverRef: popoverRef,
        onInteraction: handleInteraction,
        usePortal: true,
        isOpen: isDatePickerVisible,
      }}
      showActionsBar={props.showActionsBar}
      timePickerProps={{
        onKeyDown: handleTimePickerKeydown,
      }}
      timePrecision={props.timePrecision}
      value={props.value}
    />
  );
}

DatePickerComponent.defaultProps = {
  highlightCurrentDay: true,
};

export default DatePickerComponent;
