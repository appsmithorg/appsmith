import React, { forwardRef } from "react";

import type {
  CheckboxRef as HeadlessCheckboxRef,
  CheckboxProps as HeadlessCheckboxProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledCheckbox } from "./index.styled";

export type CheckboxProps = HeadlessCheckboxProps;

export const Checkbox = forwardRef(
  (props: CheckboxProps, ref: HeadlessCheckboxRef) => {
    const { children, labelPosition = "right", ...rest } = props;

    return (
      <StyledCheckbox labelPosition={labelPosition} ref={ref} {...rest}>
        {children && (
          <div className="label">
            <Text>{children}</Text>
          </div>
        )}
      </StyledCheckbox>
    );
  },
);
