import React from "react";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  ListBox,
  newFieldStyles,
  Popover,
} from "@appsmith/wds";
import { Select as AriaSelect } from "react-aria-components";

import type { SelectProps } from "./types";
import { SelectTrigger } from "./SelectTrigger";

export const Select = (props: SelectProps) => {
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
    <AriaSelect
      className={newFieldStyles.field}
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
            isInvalid={isInvalid}
            isLoading={isLoading}
            placeholder={placeholder}
            size={size}
          />
          <FieldDescription>{description}</FieldDescription>
          <FieldError>{errorMessage}</FieldError>
          <Popover>
            <ListBox shouldFocusWrap>{children}</ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  );
};
