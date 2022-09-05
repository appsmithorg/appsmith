import React from "react";
import styled from "styled-components";

import { sizeMap, getPosition, isMarkedFilled, SliderSizes } from "../utils";

interface MarksProps {
  marksBg: {
    filled: string;
    notFilled: string;
    label: string;
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

const MarkWrapper = styled.div<{ position: number }>(({ position }) => ({
  position: "absolute",
  top: 0,
  zIndex: 2,
  left: `${position}%`,
  pointerEvents: "none",
}));

const Mark = styled.div<Pick<MarksProps, "size">>(({ size }) => ({
  boxSizing: "border-box",
  border: `${sizeMap[size] >= 8 ? "2px" : "1px"} solid`,
  height: `${sizeMap[size]}px`,
  width: `${sizeMap[size]}px`,
  borderRadius: 1000,
  transform: `translateX(-${8 / 2}px)`,
  backgroundColor: "white",
}));

const MarkLabel = styled.p<{ color: string }>(({ color }) => ({
  fontSize: "12px",
  fontWeight: 400,
  color,
  marginTop: "5px",
  whiteSpace: "nowrap",
}));

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

    function transformStyles(
      position: number,
      index: number,
      labelLength: number,
    ): React.CSSProperties {
      // Handle long labels
      if (labelLength > 4) {
        // for labels on first 10 points on the slider
        if (index === 0 && position < 10) {
          return {
            transform: "translate(-20%, 0)",
            textAlign: "start",
          };
          // for labels on last 10 points on the slider
          // @ts-expect-error: marks won't be undefined here
        } else if (index === marks.length - 1 && position > 90) {
          return {
            transform: "translate(-80%, 0)",
            textAlign: "end",
          };
        }
      }

      return {
        transform: "translate(-50%, 0)",
        textAlign: "center",
      };
    }

    const items = marks.map((mark, index) => {
      if (mark.value > max || mark.value < min) return null;

      const position = getPosition({ value: mark.value, min, max });

      return (
        <MarkWrapper key={index} position={position}>
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
              color={marksBg.label}
              onMouseDown={(event) => {
                event.stopPropagation();
                onChange(mark.value);
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                onChange(mark.value);
              }}
              style={{
                ...transformStyles(position, index, mark.label.length),
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
