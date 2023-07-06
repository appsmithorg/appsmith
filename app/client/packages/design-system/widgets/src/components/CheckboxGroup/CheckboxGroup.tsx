import React, { forwardRef } from "react";

import type {
  CheckboxGroupRef as HeadlessCheckboxGroupRef,
  CheckboxGroupProps as HeadlessCheckboxGroupProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledCheckboxGroup } from "./index.styled";

export interface CheckboxGroupProps extends HeadlessCheckboxGroupProps {
  className?: string;
}

export const CheckboxGroup = forwardRef(
  (props: CheckboxGroupProps, ref: HeadlessCheckboxGroupRef) => {
    const { errorMessage, label, ...rest } = props;
    const wrappedErrorMessage = errorMessage && <Text>{errorMessage}</Text>;
    const wrappedLabel = label && <Text>{label}</Text>;

    return (
      <StyledCheckboxGroup
        errorMessage={wrappedErrorMessage}
        label={wrappedLabel}
        ref={ref}
        {...rest}
      />
    );
  },
);
