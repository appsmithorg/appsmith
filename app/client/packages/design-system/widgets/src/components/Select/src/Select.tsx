import React from "react";
import {
  FieldError,
  FieldLabel,
  ListBox,
  inputFieldStyles,
  Popover,
} from "@appsmith/wds";
import { Select as HeadlessSelect } from "react-aria-components";

import type { SelectProps } from "./types";
import { SelectTrigger } from "./SelectTrigger";

export const Select = (props: SelectProps) => {
  const {
    children,
    contextualHelp,
    errorMessage,
    isDisabled,
    isLoading,
    isRequired,
    label,
    placeholder,
    size = "medium",
    ...rest
  } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <HeadlessSelect
      className={inputFieldStyles.field}
      data-size={size}
      isRequired={isRequired}
      {...rest}
    >
      {({ isInvalid }) => (
        <>
          <FieldLabel
            contextualHelp={contextualHelp}
            isDisabled={isDisabled}
            isRequired={isRequired}
          >
            {label}
          </FieldLabel>
          <SelectTrigger
            isDisabled={isDisabled}
            isInvalid={isInvalid}
            isLoading={isLoading}
            placeholder={placeholder}
            size={size}
          />
          <FieldError>{errorMessage}</FieldError>
          <Popover UNSTABLE_portalContainer={root}>
            <ListBox shouldFocusWrap>{children}</ListBox>
          </Popover>
        </>
      )}
    </HeadlessSelect>
  );
};
