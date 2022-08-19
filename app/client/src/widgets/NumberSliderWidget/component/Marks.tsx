import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { sizeMap, getPosition, isMarkedFilled, SliderSizes } from "../utils";

interface MarksProps {
  marksBg: {
    filled: string;
    notFilled: string;
  };
  marks?: { value: number; label: string }[];
  marksOffset?: number;
  color: string;
  size: SliderSizes;
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange(value: number): void;
  showMarksLabel: boolean;
}

const MarkWrapper = styled.div<Pick<MarksProps, "value" | "min" | "max">>(
  ({ max, min, value }) => ({
    position: "absolute",
    top: 0,
    zIndex: 2,
    left: `${getPosition({ value, min, max })}%`,
  }),
);

const Mark = styled.div<Pick<MarksProps, "size">>(({ size }) => ({
  boxSizing: "border-box",
  border: `${sizeMap[size] >= 8 ? "2px" : "1px"} solid`,
  height: `${sizeMap[size]}px`,
  width: `${sizeMap[size]}px`,
  borderRadius: 1000,
  transform: `translateX(-${8 / 2}px)`,
  backgroundColor: "white",
}));

const MarkLabel = styled.div({
  transform: "translate(-50%, 0)",
  fontSize: "12px",
  fontWeight: 400,
  color: Colors.CHARCOAL,
  marginTop: "5px",
  overflowWrap: "break-word",
});

export const Marks = React.memo(
  ({
    marks,
    marksBg,
    marksOffset,
    max,
    min,
    onChange,
    showMarksLabel,
    size,
    value,
  }: MarksProps) => {
    if (!marks) return null;

    const items = marks.map((mark, index) => {
      if (mark.value > max || mark.value < min) return null;

      return (
        <MarkWrapper key={index} max={max} min={min} value={mark.value}>
          <Mark
            className="slider-mark"
            size={size}
            style={{
              borderColor: isMarkedFilled({ mark, offset: marksOffset, value })
                ? marksBg.filled
                : marksBg.notFilled,
            }}
          />
          {showMarksLabel && (
            <MarkLabel
              onMouseDown={(event) => {
                event.stopPropagation();
                onChange(mark.value);
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                onChange(mark.value);
              }}
            >
              {mark.label}
            </MarkLabel>
          )}
        </MarkWrapper>
      );
    });

    return <div>{items}</div>;
  },
);
