import type { LabelProps as AriaLabelProps } from "react-aria-components";

export type LabelProps = AriaLabelProps & {
  contextualHelp?: React.ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
};
