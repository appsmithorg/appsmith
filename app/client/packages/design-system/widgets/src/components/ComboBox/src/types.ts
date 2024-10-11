import type { SIZES, FieldProps } from "@appsmith/wds";
import type { ComboBoxProps as SpectrumComboBoxProps } from "react-aria-components";

export interface ComboBoxProps
  extends Omit<SpectrumComboBoxProps<object>, "slot">,
    FieldProps {
  /** size of the select
   *
   * @default medium
   */
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;

  /** The content to display as the placeholder. */
  placeholder?: string;
}
