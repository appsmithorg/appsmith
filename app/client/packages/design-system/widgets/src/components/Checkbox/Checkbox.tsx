import React, { forwardRef } from "react";

import type {
  CheckboxRef as HeadlessCheckboxRef,
  CheckboxProps as HeadlessCheckboxProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledCheckbox } from "./index.styled";

export type CheckboxProps = HeadlessCheckboxProps & {
  labelPosition?: "left" | "right";
};

export const Checkbox = forwardRef(
  (props: CheckboxProps, ref: HeadlessCheckboxRef) => {
    const { children, labelPosition = "right", ...rest } = props;

    return (
      <StyledCheckbox labelPosition={labelPosition} ref={ref} {...rest}>
        {children && <Text className="label">{children}</Text>}
      </StyledCheckbox>
    );
  },
);
