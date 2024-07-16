import React, { useEffect, useRef, useState } from "react";
import { DateInput, TimePrecision } from "@blueprintjs/datetime";
import styled from "styled-components";
import { Classes } from "../constants/classes";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "./styles.css";

const StyledDateInput = styled(DateInput)`
  & {
    input {
      color: var(--ads-color-black-750);
      background-color: var(--ads-color-black-0);
      border: 1px solid var(--ads-color-black-250);
      border-radius: 0;
      padding: 6px 8px;
      height: 36px;
      box-shadow: none;

      &:focus {
        box-shadow: none;
      }
    }
  }

  .bp3-input-group input:focus {
    border-color: var(--ads-color-black-900);
  }

  button,
  select,
  [tabindex]:not([tabindex="-1"]) {
    &:focus {
      outline: #6eb9f0 auto 2px !important;
    }
  }

  .${Classes.DATE_PICKER_OVARLAY} {
    background-color: var(--ads-color-black-5);
    color: var(--ads-color-black-750);
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
      background-color: var(--ads-color-black-250);
      .bp3-datepicker-day-wrapper.bp3-datepicker-day-wrapper {
        border: none;
      }
    }

    .DayPicker-Day.DayPicker-Day--selected,
    .DayPicker-Day.DayPicker-Day--selected:hover {
      background-color: var(--ads-color-blue-150);
      font-weight: 500;
      letter-spacing: 0.4px;
    }

    .bp3-timepicker-input-row {
      height: 35px;
      width: 110px;
      box-shadow: none;
      border-radius: 0;
      border: none;
      background-color: var(--ads-color-black-250);
      margin-bottom: 5px;

      .bp3-timepicker-input {
        color: inherit;
        box-shadow: none;
        width: 50px;
        height: 100%;
      }
    }

    .DayPicker-Day.DayPicker-Day--outside {
      color: var(--ads-color-black-450);
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
  onChange?: (selectedDate: Date | null, isUserChange: boolean) => void;
  formatDate?: (date: Date) => string;
  parseDate?: (dateStr: string) => Date | null;
  tabIndex?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
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

function whetherItIsTheLastButtonInDatepicker(
  element: HTMLElement,
  buttonText: string,
) {
  return (
    element.nodeName === "BUTTON" &&
    element.className === "bp3-button bp3-minimal" &&
    element.innerText === buttonText
  );
}

function useKeyboardNavigation(
  clearButtonText: string,
  inputRef: React.RefObject<HTMLInputElement>,
) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // to get the latest visibility value
  const DatePickerVisibilityRef = useRef(isDatePickerVisible);
  DatePickerVisibilityRef.current = isDatePickerVisible;

  const popoverRef = useRef<HTMLDivElement>(null);

  function handleDateInputClick() {
    setDatePickerVisibility(true);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (document.activeElement === inputRef.current) {
      if (e.key === "Enter") {
        setDatePickerVisibility((value) => !value);
      } else if (e.key === "Escape") {
        setDatePickerVisibility(false);
      } else if (e.key === "Tab") {
        const popoverElement = popoverRef.current;
        if (popoverElement) {
          e.preventDefault();
          const focusableElements =
            getKeyboardFocusableElements(popoverElement);
          const firstElement = focusableElements[0];
          if (firstElement) {
            (firstElement as any)?.focus();
          }
        }
      }
    } else {
      const popoverElement = popoverRef.current;
      if (popoverElement) {
        if (DatePickerVisibilityRef.current) {
          // if datepicker is visible on pressing
          // escape hide it and put focus back to input
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setDatePickerVisibility(false);
            inputRef.current?.focus();
          }

          const focusableElements =
            getKeyboardFocusableElements(popoverElement);
          if (e.key === "Tab") {
            if (e.shiftKey) {
              const lastFocusedElementIndex = focusableElements.findIndex(
                (element) => document.activeElement === element,
              );
              if (
                lastFocusedElementIndex === 1 ||
                lastFocusedElementIndex === 0
              ) {
                const lastFocusableElement = focusableElements.find((element) =>
                  whetherItIsTheLastButtonInDatepicker(
                    element as HTMLElement,
                    clearButtonText,
                  ),
                );
                if (lastFocusableElement) {
                  (lastFocusableElement as HTMLElement).focus();
                  e.preventDefault();
                }
              }
            } else {
              const lastFocusedElement = focusableElements.find(
                (element) => document.activeElement === element,
              );
              if (lastFocusedElement) {
                if (
                  whetherItIsTheLastButtonInDatepicker(
                    lastFocusedElement as HTMLElement,
                    clearButtonText,
                  )
                ) {
                  (focusableElements[0] as HTMLElement).focus();
                  e.preventDefault();
                }
              }
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    document.body.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  function handleInteraction(nextOpenState: boolean) {
    setDatePickerVisibility(nextOpenState);
    if (!nextOpenState) {
      inputRef.current?.focus();
    }
  }

  function handleTimePickerKeydown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      setDatePickerVisibility(false);
      e.stopPropagation();
      inputRef.current?.focus();
    }
  }

  return {
    // state
    isDatePickerVisible,

    // references
    popoverRef,

    // event handlers
    handleTimePickerKeydown,
    handleDateInputClick,
    handleInteraction,
  };
}

function DatePickerComponent(props: DatePickerComponentProps) {
  // this was added to check the Datepickers
  // footer action bar last Clear button
  const clearButtonText = "Clear";
  let inputRef = useRef<HTMLInputElement>(null);
  const { formatDate, onChange, parseDate } = props;

  inputRef = props.inputRef ? props.inputRef : inputRef;

  const {
    handleDateInputClick,
    handleInteraction,
    handleTimePickerKeydown,
    isDatePickerVisible,
    popoverRef,
  } = useKeyboardNavigation(clearButtonText, inputRef);

  return (
    <StyledDateInput
      className={Classes.DATE_PICKER_OVARLAY}
      clearButtonText={clearButtonText}
      closeOnSelection={props.closeOnSelection}
      formatDate={formatDate}
      highlightCurrentDay={props.highlightCurrentDay}
      inputProps={{
        inputRef: inputRef,
        onClick: handleDateInputClick,
        tabIndex: props.tabIndex,
      }}
      maxDate={props.maxDate}
      minDate={props.minDate}
      onChange={onChange}
      parseDate={parseDate}
      placeholder={props.placeholder}
      popoverProps={{
        popoverRef: popoverRef,
        onInteraction: handleInteraction,
        usePortal: true,
        isOpen: isDatePickerVisible,
        minimal: true,
        popoverClassName: "ds--date-picker-popover",
        position: "bottom",
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
