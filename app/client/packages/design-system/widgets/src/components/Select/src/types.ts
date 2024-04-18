import type { ReactNode } from "react";
import type {
  SelectProps as SpectrumSelectProps,
  ValidationResult,
} from "react-aria-components";
import type { IconProps, SIZES } from "@design-system/widgets";

export interface SelectProps<T extends object> extends SpectrumSelectProps<T> {
  /** Item objects in the collection. */
  items: Iterable<SelectItem>;
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
  size?: Omit<keyof typeof SIZES, "large">;
  /** loading state for the input */
  isLoading?: boolean;
  /** A ContextualHelp element to place next to the label. */
  contextualHelp?: ReactNode;
}

export interface SelectItem {
  name: string;
  key: number;
  icon?: IconProps["name"];
}
