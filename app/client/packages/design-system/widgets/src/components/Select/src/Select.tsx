import React from "react";
import {
  ListBox,
  Popover,
  FieldLabel,
  FieldError,
  inputFieldStyles,
  useRootContainer,
  POPOVER_LIST_BOX_MAX_HEIGHT,
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
  const root = useRootContainer();

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
            isDisabled={Boolean(isDisabled) || Boolean(isLoading)}
            isInvalid={isInvalid}
            isLoading={isLoading}
            placeholder={placeholder}
            size={size}
          />
          <FieldError>{errorMessage}</FieldError>
          <Popover
            UNSTABLE_portalContainer={root}
            maxHeight={POPOVER_LIST_BOX_MAX_HEIGHT}
          >
            <ListBox shouldFocusWrap>{children}</ListBox>
          </Popover>
        </>
      )}
    </HeadlessSelect>
  );
};
