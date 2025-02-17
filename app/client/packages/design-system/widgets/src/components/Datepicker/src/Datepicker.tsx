import {
  FieldError,
  FieldLabel,
  Popover,
  Calendar,
  inputFieldStyles,
  TimeField,
  useRootContainer,
} from "@appsmith/wds";
import clsx from "clsx";
import React from "react";
import {
  Dialog,
  DatePicker as HeadlessDatePicker,
  type TimeValue,
  type DateValue,
} from "react-aria-components";

import type { DatePickerProps } from "./types";
import datePickerStyles from "./styles.module.css";
import { DatepickerTrigger } from "./DatepickerTrigger";

export const DatePicker = <T extends DateValue>(props: DatePickerProps<T>) => {
  const {
    className,
    contextualHelp,
    errorMessage,
    isDisabled,
    isLoading,
    isRequired,
    label,
    placeholderValue,
    popoverClassName,
    size = "medium",
    ...rest
  } = props;

  const placeholder: DateValue | null | undefined = placeholderValue;
  const timePlaceholder = (
    placeholder && "hour" in placeholder ? placeholder : null
  ) as TimeValue;
  const timeMinValue = (
    props.minValue && "hour" in props.minValue ? props.minValue : null
  ) as TimeValue;
  const timeMaxValue = (
    props.maxValue && "hour" in props.maxValue ? props.maxValue : null
  ) as TimeValue;
  const root = useRootContainer();

  return (
    <HeadlessDatePicker
      aria-label={Boolean(label) ? undefined : "DatePicker"}
      className={clsx(inputFieldStyles.field, className)}
      data-size={size}
      isDisabled={isDisabled}
      isRequired={isRequired}
      {...rest}
    >
      {({ state }) => {
        const timeGranularity =
          state.granularity === "hour" ||
          state.granularity === "minute" ||
          state.granularity === "second"
            ? state.granularity
            : null;
        const showTimeField = !!timeGranularity;

        return (
          <>
            <FieldLabel
              contextualHelp={contextualHelp}
              isDisabled={isDisabled}
              isRequired={isRequired}
            >
              {label}
            </FieldLabel>
            <DatepickerTrigger
              isDisabled={isDisabled}
              isLoading={isLoading}
              size={size}
            />
            <Popover
              UNSTABLE_portalContainer={root}
              className={clsx(datePickerStyles.popover, popoverClassName)}
            >
              <Dialog className={datePickerStyles.dialog}>
                <Calendar />
                {showTimeField && (
                  <div className={datePickerStyles.timeField}>
                    <TimeField
                      granularity={timeGranularity}
                      hideTimeZone={props.hideTimeZone}
                      hourCycle={props.hourCycle}
                      label="Time"
                      maxValue={timeMaxValue}
                      minValue={timeMinValue}
                      onChange={(value) => state.setTimeValue(value!)}
                      placeholderValue={timePlaceholder}
                      value={state.timeValue}
                    />
                  </div>
                )}
              </Dialog>
            </Popover>
            <FieldError>{errorMessage}</FieldError>
          </>
        );
      }}
    </HeadlessDatePicker>
  );
};
