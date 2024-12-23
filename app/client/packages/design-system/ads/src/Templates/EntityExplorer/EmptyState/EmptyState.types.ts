import { type IconNames, type ButtonKind } from "../../..";

export interface EmptyStateProps {
  icon: IconNames;
  description: string;
  button?: {
    text: string;
    onClick?: () => void;
    kind?: ButtonKind;
    className?: string;
    testId?: string;
  };
}
