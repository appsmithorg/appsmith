import {
  FieldError,
  FieldDescription,
  FieldLabel,
  FieldCalenderPopover,
  Button,
} from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import React from "react";
import {
  DateInput,
  DateSegment,
  Group,
  DatePicker as HeadlessDatePicker,
} from "react-aria-components";

import type { DatePickerProps } from "./types";
import styles from "../../ComboBox/src/styles.module.css";

export const DatePicker = (props: DatePickerProps) => {
  const {
    contextualHelp,
    description,
    errorMessage,
    isLoading,
    isRequired,
    label,
    size = "medium",
    ...rest
  } = props;

  return (
    <HeadlessDatePicker
      aria-label={Boolean(label) ? undefined : "DatePicker"}
      className={styles.formField}
      data-size={size}
      isRequired={isRequired}
      {...rest}
    >
      {({ isInvalid }) => (
        <>
          <FieldLabel
            contextualHelp={contextualHelp}
            isRequired={isRequired}
            text={label}
          />
          <Group className={styles.inputWrapper}>
            <DateInput
              className={clsx(styles.input, getTypographyClassName("body"))}
              data-date-input
            >
              {(segment) => <DateSegment segment={segment} />}
            </DateInput>
            <Button
              color={Boolean(isLoading) ? "neutral" : "accent"}
              icon="calendar-month"
              isLoading={isLoading}
              size={size === "medium" ? "small" : "xSmall"}
              variant={Boolean(isLoading) ? "ghost" : "filled"}
            />
          </Group>
          <FieldError errorMessage={errorMessage} />
          <FieldDescription description={description} isInvalid={isInvalid} />
          <FieldCalenderPopover />
        </>
      )}
    </HeadlessDatePicker>
  );
};
