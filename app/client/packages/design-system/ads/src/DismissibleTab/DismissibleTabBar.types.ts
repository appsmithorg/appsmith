import type React from "react";
import type { DismissibleTabProps } from "./DismissibleTab.types";

export interface DismissibleTabBarProps {
  /** The content of the tab bar. */
  children:
    | React.ReactElement<DismissibleTabProps>
    | React.ReactElement<DismissibleTabProps>[]
    | React.ReactNode;
  /** Used for custom styling, necessary for styled-components. */
  className?: string;
  /** Button is visible, but disabled & not clickable. */
  disableAdd?: boolean;
  /** Hides add button completely. */
  hideAdd?: boolean;
  /** Will display a loader in place of add button. */
  isAddingNewTab?: boolean;
  /** Callback tab is added.  */
  onTabAdd: () => void;
}
