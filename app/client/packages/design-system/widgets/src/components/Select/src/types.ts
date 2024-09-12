import type {
  SelectProps as SpectrumSelectProps,
  ValidationResult,
} from "react-aria-components";
import type { SIZES, FieldListPopoverItem } from "@appsmith/wds";

export interface SelectProps
  extends Omit<SpectrumSelectProps<FieldListPopoverItem>, "slot"> {
  /** Item objects in the collection. */
  items: FieldListPopoverItem[];
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
