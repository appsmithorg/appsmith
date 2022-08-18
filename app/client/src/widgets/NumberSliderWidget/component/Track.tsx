import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { Marks } from "./Marks";
import { sizeMap, SliderSizes, SliderType } from "../utils";

interface TrackProps {
  marksBg: {
    filled: string;
    notFilled: string;
  };
  trackBgColor: string;
  barBgColor: string;
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

const TrackWrapper = styled.div<
  Pick<TrackProps, "size" | "disabled" | "trackBgColor">
>(({ disabled, size, trackBgColor }) => ({
  position: "relative",
  height: `${sizeMap[size]}px`,
  width: "100%",
  marginRight: `${sizeMap[size]}px`,
  marginLeft: `${sizeMap[size]}px`,

  /**
   * When we hover on the Track give mark border focus color
   */
  "&:hover .slider-mark": {
    borderColor: disabled ? Colors.GREY_5 : Colors.GRAY_400,
  },

  /**
   * This is the area which is in grey
   */
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: "16px",
    right: `${-sizeMap[size]}px`,
    left: `${-sizeMap[size]}px`,
    backgroundColor: trackBgColor,
    zIndex: 0,
  },
}));

const Bar = styled.div<
  Pick<TrackProps, "filled" | "offset" | "size" | "barBgColor">
>(({ barBgColor, filled, offset, size }) => ({
  position: "absolute",
  zIndex: 1,
  top: 0,
  bottom: 0,
  /**
   * This is the area which is in color (not grey)
   */
  backgroundColor: barBgColor,
  borderRadius: "16px",
  left: `calc(${offset}% - ${sizeMap[size]}px)`,
  width: `calc(${filled}% + ${sizeMap[size]}px)`,
}));

export function Track({
  trackBgColor,
  barBgColor,
  children,
  color,
  disabled,
  filled,
  marksOffset,
  offset,
  onMouseEnter,
  onMouseLeave,
  size,
  marksBg,
  sliderType = SliderType.LINEAR,
  ...delegated
}: TrackProps) {
  return (
    <TrackWrapper
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      size={size}
      trackBgColor={trackBgColor}
    >
      <Bar
        barBgColor={barBgColor}
        filled={filled}
        offset={offset}
        size={size}
      />
      {children}
      <Marks
        color={color}
        disabled={disabled}
        marksBg={marksBg}
        marksOffset={marksOffset}
        size={size}
        sliderType={sliderType}
        {...delegated}
      />
    </TrackWrapper>
  );
}
