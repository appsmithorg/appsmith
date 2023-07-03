import React, { forwardRef } from "react";

import type {
  RadioRef as HeadlessRadioRef,
  RadioProps as HeadlessRadioProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { StyledRadio } from "./index.styled";

export type RadioProps = HeadlessRadioProps;

export const Radio = forwardRef((props: RadioProps, ref: HeadlessRadioRef) => {
  const { children, labelPosition = "right", ...rest } = props;

  return (
    <StyledRadio labelPosition={labelPosition} ref={ref} {...rest}>
      {children && <Text>{children}</Text>}
    </StyledRadio>
  );
});
