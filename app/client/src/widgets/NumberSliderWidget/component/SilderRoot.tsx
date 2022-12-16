import styled from "styled-components";
import React, { forwardRef } from "react";
import { LabelPosition } from "components/constants";

import { SliderSizes, sizeMap } from "../utils";

export interface SliderRootProps extends React.ComponentPropsWithoutRef<"div"> {
  disabled: boolean;
  size: SliderSizes;
  children?: React.ReactNode;
  labelPosition?: LabelPosition;
}

const SliderWrapper = styled.div<SliderRootProps>(
  ({ disabled, labelPosition, size }) => ({
    WebkitTapHighlightColor: "transparent",
    outline: 0,
    height: `${sizeMap[size] * 2}px`,
    display: "flex",
    alignItems: labelPosition === LabelPosition.Top ? "flex-end" : "center",
    marginBottom: labelPosition === LabelPosition.Top ? "1.5rem" : 0,
    flex: 1,
    width: "100%",
    cursor: disabled ? "not-allowed" : "pointer",
  }),
);

export const SliderRoot = forwardRef<HTMLDivElement, SliderRootProps>(
  (props, ref) => {
    return <SliderWrapper {...props} ref={ref} tabIndex={-1} />;
  },
);
