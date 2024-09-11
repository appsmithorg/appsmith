import type { Key } from "@react-types/shared";
import type {
  SelectProps as SpectrumSelectProps,
  ValidationResult,
} from "react-aria-components";
import type { IconProps, SIZES } from "@appsmith/wds";

export interface SelectProps
  extends Omit<SpectrumSelectProps<SelectItem>, "slot"> {
  /** Item objects in the collection. */
  items: SelectItem[];
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
  contextualHelp?: string;
}

export interface SelectItem {
  id: Key;
  label: string;
  icon?: IconProps["name"];
}
