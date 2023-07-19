import React, { forwardRef } from "react";

import type {
  CheckboxRef as HeadlessSwitchRef,
  CheckboxProps as HeadlessSwitchProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledSwitch } from "./index.styled";

export type SwitchProps = HeadlessSwitchProps;

export const Switch = forwardRef(
  (props: SwitchProps, ref: HeadlessSwitchRef) => {
    const { children, labelPosition = "right", ...rest } = props;

    return (
      <StyledSwitch
        icon={null}
        labelPosition={labelPosition}
        ref={ref}
        {...rest}
      >
        {children && <Text>{children}</Text>}
      </StyledSwitch>
    );
  },
);
