interface GetPosition {
  value: number;
  min: number;
  max: number;
}

/**
 *
 * @returns the position of value to be used in the Track component
 */
export function getPosition({ max, min, value }: GetPosition) {
  const position = ((value - min) / (max - min)) * 100;
  return Math.min(Math.max(position, 0), 100);
}

interface GetChangeValue {
  value: number;
  min: number;
  max: number;
  step: number;
  /**
   * precision is used when we are using decimal numbers as step size
   */
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
  precision,
  step,
  value,
}: GetChangeValue) {
  const left = !containerWidth
    ? value
    : Math.min(Math.max(value, 0), containerWidth) / containerWidth;

  const dx = left * (max - min);

  const nextValue = (dx !== 0 ? Math.round(dx / step) * step : 0) + min;

  if (precision !== undefined) {
    return Number(nextValue.toFixed(precision));
  }

  return nextValue;
}

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

interface IsMarkedFilled {
  mark: { value: number; label?: any };
  offset?: number;
  value: number;
}

export function isMarkedFilled({ mark, offset, value }: IsMarkedFilled) {
  return typeof offset === "number"
    ? mark.value >= offset && mark.value <= value
    : mark.value <= value;
}

export const thumbSizeMap = {
  sm: "12px",
  md: "16px",
  lg: "20px",
};

export const sizeMap = {
  sm: 6,
  md: 8,
  lg: 10,
};

export type SliderSizes = "sm" | "md" | "lg";

export enum SliderType {
  LINEAR = "LINEAR",
  CATEGORICAL = "CATEGORICAL",
}

export type SliderOption = {
  label: string;
  value: string;
};
