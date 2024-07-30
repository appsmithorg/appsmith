import type { CheckboxProps as HeadlessCheckboxProps } from "react-aria-components";
import type { POSITION } from "@design-system/widgets";

export interface SwitchProps
  extends Omit<HeadlessCheckboxProps, "isIndeterminate" | "isReadOnly"> {
  labelPosition?: keyof typeof POSITION;
}
