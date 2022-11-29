import React, { useState, forwardRef } from "react";
import styled from "styled-components";

import { getRgbaColor } from "widgets/WidgetUtils";
import { SliderSizes, thumbSizeMap } from "../utils";

interface ThumbProps {
  thumbBgColor: string;
  max: number;
  min: number;
  position: number;
  dragging: boolean;
  color: string;
  size: SliderSizes;
  onMouseDown(
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ): void;
  tooltipValue: string;
  tooltipAlwaysOn: boolean;
  onFocus?(): void;
  onBlur?(): void;
  showTooltipOnHover: boolean;
  children?: React.ReactNode;
  disabled: boolean;
}

const Tooltip = styled.div({
  position: "absolute",
  top: -36,
  backgroundColor: "#212529",
  fontSize: "12px",
  fontWeight: 400,
  color: "white",
  padding: "5px",
  borderRadius: "4px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  userSelect: "none",
});

const ThumbWrapper = styled.div<
  Pick<ThumbProps, "color" | "disabled" | "position" | "size" | "thumbBgColor">
>(({ color, disabled, position, size, thumbBgColor }) => ({
  boxSizing: "border-box",
  position: "absolute",
  display: "flex",
  height: thumbSizeMap[size],
  width: thumbSizeMap[size],
  backgroundColor: thumbBgColor,
  border: `4px solid ${thumbBgColor}`,
  top: "50%",
  cursor: disabled ? "not-allowed" : "pointer",
  borderRadius: 1000,
  alignItems: "center",
  justifyContent: "center",
  transitionDuration: "100ms",
  transitionProperty: "box-shadow, transform",
  transitionTimingFunction: "ease",
  zIndex: 3,
  userSelect: "none",
  transform: "translate(-50%, -50%)",
  left: `${position}%`,

  "&:focus": {
    boxShadow: `0 0 0px 4px ${getRgbaColor(color, 0.2)}`,
  },
}));

export const Thumb = forwardRef<HTMLDivElement, ThumbProps>(
  (
    {
      children = null,
      color,
      disabled,
      dragging,
      max,
      min,
      onBlur,
      onFocus,
      onMouseDown,
      position,
      showTooltipOnHover,
      size,
      thumbBgColor,
      tooltipAlwaysOn,
      tooltipValue,
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const isVisible =
      tooltipAlwaysOn || dragging || focused || showTooltipOnHover;

    return (
      <ThumbWrapper
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={parseInt(tooltipValue)}
        color={color}
        data-cy="slider-thumb"
        disabled={disabled}
        onBlur={() => {
          setFocused(false);
          typeof onBlur === "function" && onBlur();
        }}
        onClick={(event) => event.stopPropagation()}
        onFocus={() => {
          setFocused(true);
          typeof onFocus === "function" && onFocus();
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
        position={position}
        ref={ref}
        role="slider"
        size={size}
        tabIndex={0}
        thumbBgColor={thumbBgColor}
      >
        {children}

        {isVisible && tooltipValue !== "" ? (
          <Tooltip>{tooltipValue}</Tooltip>
        ) : null}
      </ThumbWrapper>
    );
  },
);
