import type { IconNames } from "../../../Icon";
import type { ButtonKind } from "../../../Button";

export interface EmptyStateProps {
  icon: IconNames;
  description: string;
  button?: {
    text: string;
    onClick?: () => void;
    kind?: Extract<ButtonKind, "primary" | "secondary">;
    className?: string;
    testId?: string;
  };
}
