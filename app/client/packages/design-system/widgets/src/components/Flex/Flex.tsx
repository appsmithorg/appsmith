import type { ReactNode, Ref } from "react";
import React, { forwardRef } from "react";
import { StyledFlex } from "./index.styled";

export interface FlexProps {
  children: ReactNode;
}

export const Flex = forwardRef((props: FlexProps, ref: Ref<HTMLDivElement>) => {
  const { children } = props;

  return <StyledFlex ref={ref}>{children}</StyledFlex>;
});
