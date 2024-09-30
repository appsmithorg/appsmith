import type {
  DateValue,
  DatePickerProps as SpectrumDatePickerProps,
  ValidationResult,
} from "react-aria-components";
import type { SIZES } from "@appsmith/wds";

export interface DatePickerProps
  extends Omit<SpectrumDatePickerProps<DateValue>, "slot" | "placeholder"> {
  /** The content to display as the label. */
  label?: string;
  /** The content to display as the description. */
  description?: string;
  /** The content to display as the error message. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  /** size of the select
   *
   * @default medium
   */
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;
  /** loading state for the input */
  isLoading?: boolean;
  /** A ContextualHelp element to place next to the label. */
  contextualHelp?: string;
  /** The content to display as the placeholder. */
  placeholder?: string;
}

export type { DateValue };
