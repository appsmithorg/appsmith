import React from "react";
import styled from "styled-components";

import { getPosition, isMarkedFilled, sizeMap, SliderSizes } from "../utils";

interface MarksProps {
  marks?: { value: number; label: string }[];
  marksOffset?: number;
  color: string;
  size: SliderSizes;
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange(value: number): void;
}

const MarkWrapper = styled.div<Pick<MarksProps, "value" | "min" | "max">>(
  ({ max, min, value }) => ({
    position: "absolute",
    top: 0,
    zIndex: 2,
    left: `${getPosition({ value, min, max })}%`,
  }),
);

const Mark = styled.div<
  Pick<MarksProps, "color" | "disabled" | "size"> & { isMarkFilled: boolean }
>(({ color, disabled, isMarkFilled, size }) => ({
  boxSizing: "border-box",
  border: `${sizeMap[size] >= 8 ? "2px" : "1px"} solid #e9ecef`,
  height: `${sizeMap[size]}px`,
  width: `${sizeMap[size]}px`,
  borderRadius: 1000,
  transform: `translateX(-${8 / 2}px)`,
  backgroundColor: "white",
  borderColor: isMarkFilled ? (disabled ? "#ced4da" : color) : undefined,
}));

const MarkLabel = styled.div({
  transform: "translate(-50%, 0)",
  fontSize: "14px",
  color: "#868e96",
  marginTop: "5px",
  overflowWrap: "break-word",
});

export const Marks = React.memo(
  ({
    color,
    disabled,
    marks,
    marksOffset,
    max,
    min,
    onChange,
    size,
    value,
  }: MarksProps) => {
    if (!marks) return null;

    const items = marks.map((mark, index) => {
      if (mark.value > max || mark.value < min) return null;

      return (
        <MarkWrapper key={index} max={max} min={min} value={mark.value}>
          <Mark
            color={color}
            disabled={disabled}
            isMarkFilled={isMarkedFilled({ mark, offset: marksOffset, value })}
            size={size}
          />
          {mark.label && (
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
