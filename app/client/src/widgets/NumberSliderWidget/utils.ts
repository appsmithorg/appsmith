import { Colors } from "constants/Colors";
import { darkenColor } from "widgets/WidgetUtils";

interface Position {
  value: number;
  min: number;
  max: number;
}

/**
 *
 * @returns the position of value to be used in the Track component
 */
export function getPosition({ max, min, value }: Position) {
  const position = ((value - min) / (max - min)) * 100;
  return Math.min(Math.max(position, 0), 100);
}

interface ChangeValue {
  value: number;
  min: number;
  max: number;
  step: number;
  precision?: number;
  /**
   * container width is passed in case of RangeSlider
   */
  containerWidth?: number;
}

export function getChangeValue({
  containerWidth,
  max,
  min,
  step,
  value,
}: ChangeValue) {
  const left = !containerWidth
    ? value
    : Math.min(Math.max(value, 0), containerWidth) / containerWidth;

  const dx = left * (max - min);

  const nextValue = (dx !== 0 ? Math.round(dx / step) * step : 0) + min;

  return Math.max(Math.min(nextValue, max), min);
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getClientPosition(event: any) {
  if ("TouchEvent" in window && event instanceof window.TouchEvent) {
    const touch = event.touches[0];
    return touch.clientX;
  }

  return event.clientX;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface MarkedFilled {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mark: { value: number; label?: any };
  offset?: number;
  value: number;
}

export function isMarkedFilled({ mark, offset, value }: MarkedFilled) {
  return typeof offset === "number"
    ? mark.value >= offset && mark.value <= value
    : mark.value <= value;
}

export const thumbSizeMap = {
  s: "12px",
  m: "16px",
  l: "20px",
};

export const sizeMap = {
  s: 4,
  m: 6,
  l: 8,
};

export type SliderSizes = "s" | "m" | "l";

export const getSliderStyles = ({
  color,
  disabled,
  dragging,
  hovering,
}: {
  disabled: boolean;
  hovering: boolean;
  dragging: boolean;
  color: string;
}) => {
  const darkColor = darkenColor(color);

  if (disabled) {
    return {
      track: Colors.GREY_5,
      bar: Colors.GREY_6,
      thumb: Colors.GREY_6,
      marks: {
        filled: Colors.GREY_6,
        notFilled: Colors.GREY_5,
        label: Colors.DARK_GRAY,
      },
    };
  }

  if (hovering || dragging) {
    return {
      track: Colors.GRAY_400,
      bar: darkColor,
      thumb: darkColor,
      marks: {
        filled: darkColor,
        notFilled: Colors.GRAY_400,
        label: Colors.CHARCOAL,
      },
    };
  }

  return {
    track: Colors.GREY_5,
    bar: color,
    thumb: color,
    marks: {
      filled: color,
      notFilled: Colors.GREY_5,
      label: Colors.CHARCOAL,
    },
  };
};
