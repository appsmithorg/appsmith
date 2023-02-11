import React from "react";
import styled from "styled-components";

import { Marks } from "./Marks";
import { sizeMap, SliderSizes } from "../utils";

interface TrackProps {
  marksBg: {
    filled: string;
    notFilled: string;
    label: string;
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
  showMarksLabel: boolean;
}

const TrackWrapper = styled.div<Pick<TrackProps, "size" | "trackBgColor">>(
  ({ size, trackBgColor }) => ({
    position: "relative",
    height: `${sizeMap[size]}px`,
    width: "100%",
    marginRight: `${sizeMap[size]}px`,
    marginLeft: `${sizeMap[size]}px`,

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
  }),
);

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
  barBgColor,
  children,
  color,
  disabled,
  filled,
  marks,
  marksBg,
  marksOffset,
  offset,
  onMouseEnter,
  onMouseLeave,
  showMarksLabel,
  size,
  trackBgColor,
  ...delegated
}: TrackProps) {
  return (
    <TrackWrapper
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
      {marks && marks.length > 0 ? (
        <Marks
          color={color}
          disabled={disabled}
          marks={marks}
          marksBg={marksBg}
          marksOffset={marksOffset}
          showMarksLabel={showMarksLabel}
          size={size}
          {...delegated}
        />
      ) : null}
    </TrackWrapper>
  );
}
