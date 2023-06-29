import React, { forwardRef } from "react";

import type {
  RadioGroupRef as HeadlessRadioGroupRef,
  RadioGroupProps as HeadlessRadioGroupProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledRadioGroup } from "./index.styled";

export interface RadioGroupProps extends HeadlessRadioGroupProps {
  className?: string;
}

export const RadioGroup = forwardRef(
  (props: RadioGroupProps, ref: HeadlessRadioGroupRef) => {
    const { errorMessage, label, ...rest } = props;
    const wrappedErrorMessage = errorMessage && <Text>{errorMessage}</Text>;
    const wrappedLabel = label && <Text>{label}</Text>;

    return (
      <StyledRadioGroup
        errorMessage={wrappedErrorMessage}
        label={wrappedLabel}
        ref={ref}
        {...rest}
      />
    );
  },
);
