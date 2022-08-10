import styled from "styled-components";
import React, { forwardRef } from "react";

import { SliderSizes, sizeMap } from "../utils";

export interface SliderRootProps extends React.ComponentPropsWithoutRef<"div"> {
  disabled: boolean;
  size: SliderSizes;
  children?: React.ReactNode;
}

const SliderWrapper = styled.div<SliderRootProps>(({ disabled, size }) => ({
  WebkitTapHighlightColor: "transparent",
  outline: 0,
  flex: 1,
  height: `${sizeMap[size] * 2}px`,
  display: "flex",
  alignItems: "center",
  cursor: disabled ? "not-allowed" : "pointer",
}));

export const SliderRoot = forwardRef<HTMLDivElement, SliderRootProps>(
  (props, ref) => {
    return <SliderWrapper {...props} ref={ref} tabIndex={-1} />;
  },
);
