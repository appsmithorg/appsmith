import {
  FieldError,
  FieldDescription,
  FieldLabel,
  Popover,
  ListBox,
  newFieldStyles,
} from "@appsmith/wds";
import React from "react";
import { ComboBox as HeadlessCombobox } from "react-aria-components";
import type { ComboBoxProps } from "./types";
import { ComboBoxTrigger } from "./ComboBoxTrigger";

export const ComboBox = (props: ComboBoxProps) => {
  const {
    children,
    contextualHelp,
    description,
    errorMessage,
    isDisabled,
    isLoading,
    isRequired,
    label,
    placeholder,
    size = "medium",
    ...rest
  } = props;

  return (
    <HeadlessCombobox
      aria-label={Boolean(label) ? undefined : "ComboBox"}
      className={newFieldStyles.field}
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
        isLoading={isLoading}
        placeholder={placeholder}
        size={size}
      />
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{errorMessage}</FieldError>
      <Popover>
        <ListBox shouldFocusWrap>{children}</ListBox>
      </Popover>
    </HeadlessCombobox>
  );
};
