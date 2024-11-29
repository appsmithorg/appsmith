import clsx from "clsx";
import React, { useMemo } from "react";
import type { SIZES } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { textInputStyles, Spinner, IconButton } from "@appsmith/wds";
import { DateInput, DateSegment, Group } from "react-aria-components";

import dateInputStyles from "./styles.module.css";

interface DatepickerTriggerProps {
  isLoading?: boolean;
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;
  isDisabled?: boolean;
}

export const DatepickerTrigger = (props: DatepickerTriggerProps) => {
  const { isDisabled, isLoading, size } = props;

  const suffix = useMemo(() => {
    if (Boolean(isLoading)) return <Spinner />;

    return (
      <IconButton
        color={Boolean(isLoading) ? "neutral" : "accent"}
        icon="calendar-month"
        isDisabled={isDisabled}
        isLoading={isLoading}
        size={size === "medium" ? "small" : "xSmall"}
        variant={Boolean(isLoading) ? "ghost" : "filled"}
      />
    );
  }, [isLoading, size, isDisabled]);

  return (
    <Group className={textInputStyles.inputGroup}>
      <DateInput
        className={clsx(
          textInputStyles.input,
          dateInputStyles.input,
          getTypographyClassName("body"),
        )}
        data-date-input
      >
        {(segment) => <DateSegment segment={segment} />}
      </DateInput>
      <span data-input-suffix>{suffix}</span>
    </Group>
  );
};
