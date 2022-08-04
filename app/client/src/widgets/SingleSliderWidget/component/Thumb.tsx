import React, { useState, forwardRef } from "react";
import styled from "styled-components";

import { SliderSizes, thumbSizeMap } from "../utils";

interface ThumbProps {
  max: number;
  min: number;
  value: number;
  position: number;
  dragging: boolean;
  color: string;
  size: SliderSizes;
  onMouseDown(
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ): void;
  label?: string;
  labelAlwaysOn: boolean;
  onFocus?(): void;
  onBlur?(): void;
  showLabelOnHover?: boolean;
  children?: React.ReactNode;
  disabled: boolean;
}

const Label = styled.div({
  position: "absolute",
  top: -36,
  backgroundColor: "#212529",
  fontSize: "12px",
  color: "white",
  padding: "5px",
  borderRadius: "4px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  userSelect: "none",
});

const ThumbWrapper = styled.div<
  Pick<ThumbProps, "color" | "disabled" | "dragging" | "position" | "size">
>(({ color, disabled, dragging, position, size }) => ({
  boxSizing: "border-box",
  position: "absolute",
  display: disabled ? "none" : "flex",
  height: thumbSizeMap[size],
  width: thumbSizeMap[size],
  backgroundColor: "white",
  border: `4px solid ${color}`,
  top: "50%",
  cursor: "pointer",
  borderRadius: 1000,
  alignItems: "center",
  justifyContent: "center",
  transitionDuration: "100ms",
  transitionProperty: "box-shadow, transform",
  transitionTimingFunction: "ease",
  zIndex: 3,
  userSelect: "none",
  transform: dragging
    ? "translate(-50%, -50%) scale(1.05)"
    : "translate(-50%, -50%)",
  boxShadow: dragging
    ? "0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px"
    : "none",
  left: `${position}%`,

  "&:focus": {
    outlineOffset: "2 !important",
    outline: `2px solid ${color} !important`,
  },
}));

export const Thumb = forwardRef<HTMLDivElement, ThumbProps>(
  (
    {
      children = null,
      color,
      disabled,
      dragging,
      label,
      labelAlwaysOn,
      max,
      min,
      onBlur,
      onFocus,
      onMouseDown,
      position,
      showLabelOnHover,
      size,
      value,
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const isVisible = labelAlwaysOn || dragging || focused || showLabelOnHover;

    return (
      <ThumbWrapper
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        color={color}
        disabled={disabled}
        dragging={dragging}
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
      >
        {children}

        {isVisible && <Label>{label}</Label>}
      </ThumbWrapper>
    );
  },
);
