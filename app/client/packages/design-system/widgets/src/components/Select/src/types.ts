import type { SIZES, FieldProps } from "@appsmith/wds";
import type { SelectProps as SpectrumSelectProps } from "react-aria-components";

export interface SelectProps
  extends Omit<SpectrumSelectProps<object>, "slot">,
    FieldProps {
  /** size of the select
   *
   * @default medium
   */
  size?: Exclude<keyof typeof SIZES, "xSmall" | "large">;
}
