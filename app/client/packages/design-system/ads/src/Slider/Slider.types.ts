import type { AriaSliderProps } from "@react-types/slider";

export interface SliderProps
  extends Omit<AriaSliderProps<number>, "orientation"> {
  /**  If the value represents an offset, the fill start can be set to represent the point of origin. This allows the slider fill to start from inside the track. */
  origin?: number;
  /** Allows you to customize the format of the value. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#browser_compatibility */
  formatOptions?: Intl.NumberFormatOptions;
  /** A function that returns the content to display as the value's label. Overrides default formatted number. */
  getValueLabel?: (value: number) => string;
  /** Property path for JS toggle */
  configProperty?: string;
  /** Form name for JS toggle */
  formName?: string;
}
