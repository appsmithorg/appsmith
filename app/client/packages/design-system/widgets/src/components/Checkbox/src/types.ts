import type { CheckboxProps as HeadlessCheckboxProps } from "react-aria-components";
import type { POSITION } from "../../../shared";

export interface CheckboxProps extends HeadlessCheckboxProps {
  labelPosition?: keyof typeof POSITION;
}
