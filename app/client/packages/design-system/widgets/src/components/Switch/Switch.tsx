import React, { forwardRef } from "react";

import type {
  SwitchRef as HeadlessSwitchRef,
  SwitchProps as HeadlessSwitchProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledSwitch } from "./index.styled";

export type SwitchProps = Omit<HeadlessSwitchProps, "icon" | "isIndeterminate">;

export const Switch = forwardRef(
  (props: SwitchProps, ref: HeadlessSwitchRef) => {
    const { children, labelPosition = "right", ...rest } = props;

    return (
      <StyledSwitch
        labelPosition={labelPosition}
        ref={ref}
        {...rest}
        icon={null}
      >
        {children && <Text>{children}</Text>}
      </StyledSwitch>
    );
  },
);
