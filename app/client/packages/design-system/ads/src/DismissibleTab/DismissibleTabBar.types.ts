import type React from "react";
import type { DismissibleTabProps } from "./DismissibleTab.types";

export interface DismissibleTabBarProps {
  children:
    | React.ReactElement<DismissibleTabProps>
    | React.ReactElement<DismissibleTabProps>[]
    | React.ReactNode;
  className?: string;
  disableAdd?: boolean;
  hideAdd?: boolean;
  isAddingNewTab?: boolean;
  onTabAdd: () => void;
}
