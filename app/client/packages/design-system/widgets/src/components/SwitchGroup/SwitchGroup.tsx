import React, { forwardRef } from "react";

import type {
  CheckboxGroupRef as HeadlessSwitchGroupRef,
  CheckboxGroupProps as HeadlessSwitchGroupProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledSwitchGroup } from "./index.styled";

export interface SwitchGroupProps extends HeadlessSwitchGroupProps {
  className?: string;
}

export const SwitchGroup = forwardRef(
  (props: SwitchGroupProps, ref: HeadlessSwitchGroupRef) => {
    const { errorMessage, label, ...rest } = props;
    const wrappedErrorMessage = errorMessage && <Text>{errorMessage}</Text>;
    const wrappedLabel = label && <Text>{label}</Text>;

    return (
      <StyledSwitchGroup
        errorMessage={wrappedErrorMessage}
        label={wrappedLabel}
        ref={ref}
        {...rest}
      />
    );
  },
);
