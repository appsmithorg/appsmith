import type {
  DateValue,
  DatePickerProps as SpectrumDatePickerProps,
} from "react-aria-components";
import type { SIZES, FieldProps } from "@appsmith/wds";

export interface DatePickerProps<T extends DateValue>
  extends Omit<SpectrumDatePickerProps<T>, "slot" | "placeholder">,
    FieldProps {
  /** size of the select
   *
   * @default medium
   */
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;
  /**
   * className for the popover
   */
  popoverClassName?: string;
}

export type { DateValue };
