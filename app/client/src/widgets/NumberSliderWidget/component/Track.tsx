import { Colors } from "constants/Colors";
import React from "react";
import styled from "styled-components";

import { Marks } from "./Marks";
import { sizeMap, SliderSizes, SliderType } from "../utils";

interface TrackProps {
  filled: number;
  offset: number;
  marksOffset?: number;
  marks?: { value: number; label: string }[];
  color: string;
  size: SliderSizes;
  min: number;
  max: number;
  value: number;
  children: React.ReactNode;
  disabled: boolean;
  onChange(value: number): void;
  onMouseEnter?(event?: React.MouseEvent<HTMLDivElement>): void;
  onMouseLeave?(event?: React.MouseEvent<HTMLDivElement>): void;
  sliderType?: SliderType;
}

const TrackWrapper = styled.div<Pick<TrackProps, "size">>(({ size }) => ({
  position: "relative",
  height: `${sizeMap[size]}px`,
  width: "100%",
  marginRight: `${sizeMap[size]}px`,
  marginLeft: `${sizeMap[size]}px`,

  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: "16px",
    right: `${-sizeMap[size]}px`,
    left: `${-sizeMap[size]}px`,
    backgroundColor: Colors.MERCURY,
    zIndex: 0,
  },
}));

const Bar = styled.div<
  Pick<TrackProps, "color" | "disabled" | "filled" | "offset" | "size">
>(({ color, disabled, filled, offset, size }) => ({
  position: "absolute",
  zIndex: 1,
  top: 0,
  bottom: 0,
  backgroundColor: disabled ? "#ced4da" : color,
  borderRadius: "16px",
  left: `calc(${offset}% - ${sizeMap[size]}px)`,
  width: `calc(${filled}% + ${sizeMap[size]}px)`,
}));

export function Track({
  children,
  color,
  disabled,
  filled,
  marksOffset,
  offset,
  onMouseEnter,
  onMouseLeave,
  size,
  sliderType = SliderType.LINEAR,
  ...delegated
}: TrackProps) {
  return (
    <TrackWrapper
      color={color}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      size={size}
    >
      <Bar
        color={color}
        disabled={disabled}
        filled={filled}
        offset={offset}
        size={size}
      />
      {children}
      <Marks
        color={color}
        disabled={disabled}
        marksOffset={marksOffset}
        size={size}
        sliderType={sliderType}
        {...delegated}
      />
    </TrackWrapper>
  );
}
