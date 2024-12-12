import {
  Popover,
  ListBox,
  FieldLabel,
  FieldError,
  inputFieldStyles,
} from "@appsmith/wds";
import React from "react";
import { ComboBox as HeadlessCombobox } from "react-aria-components";

import type { ComboBoxProps } from "./types";
import { ComboBoxTrigger } from "./ComboBoxTrigger";

export const ComboBox = (props: ComboBoxProps) => {
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
    <HeadlessCombobox
      aria-label={Boolean(label) ? undefined : "ComboBox"}
      className={inputFieldStyles.field}
      data-size={size}
      isDisabled={isDisabled}
      isRequired={isRequired}
      {...rest}
    >
      <FieldLabel
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
      >
        {label}
      </FieldLabel>
      <ComboBoxTrigger
        isDisabled={isDisabled}
        isLoading={isLoading}
        placeholder={placeholder}
        size={size}
      />
      <FieldError>{errorMessage}</FieldError>
      <Popover UNSTABLE_portalContainer={root} data-combobox-popover>
        <ListBox data-combobox-listbox shouldFocusWrap>
          {children}
        </ListBox>
      </Popover>
    </HeadlessCombobox>
  );
};
