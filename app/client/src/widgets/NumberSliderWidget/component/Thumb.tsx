import React, { useState, forwardRef } from "react";
import styled, { css } from "styled-components";

import { getRgbaColor } from "widgets/WidgetUtils";
import type { SliderSizes } from "../utils";
import { thumbSizeMap } from "../utils";

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

const Tooltip = styled.div`
  position: absolute;
  top: -36px;
  background-color: #212529;
  font-size: 12px;
  font-weight: 400;
  color: white;
  padding: 5px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
`;

const ThumbWrapper = styled.div<
  Pick<ThumbProps, "color" | "disabled" | "position" | "size" | "thumbBgColor">
>`
  ${({ color, disabled, position, size, thumbBgColor }) => {
    return css`
      box-sizing: border-box;
      position: absolute;
      display: flex;
      height: ${thumbSizeMap[size]};
      width: ${thumbSizeMap[size]};
      background-color: ${thumbBgColor};
      border: 4px solid ${thumbBgColor};
      top: 50%;
      cursor: ${disabled ? "not-allowed" : "pointer"};
      border-radius: 1000px;
      align-items: center;
      justify-content: center;
      transition-duration: 100ms;
      transition-property: box-shadow, transform;
      transition-timing-function: ease;
      z-index: 3;
      user-select: none;
      transform: translate(-50%, -50%);
      left: ${position}%;

      &:focus {
        box-shadow: 0 0 0px 4px ${getRgbaColor(color, 0.2)};
      }
    `;
  }}
`;

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
        data-testid="slider-thumb"
        disabled={disabled}
        onBlur={() => {
          setFocused(false);
          typeof onBlur === "function" && onBlur();
        }}
        onClick={(event: { stopPropagation: () => void }) =>
          event.stopPropagation()
        }
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
