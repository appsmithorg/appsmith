import type { LabelProps as HeadlessLabelProps } from "react-aria-components";

export interface LabelProps extends HeadlessLabelProps {
  text?: string;
  contextualHelp?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}
