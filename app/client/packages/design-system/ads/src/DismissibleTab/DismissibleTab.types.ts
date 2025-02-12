import type React from "react";

export interface DismissibleTabProps {
  /** The content of the tab. */
  children: React.ReactNode;
  /** Used for custom styling, necessary for styled-components. */
  className?: string;
  /** Used for passing data-testid. */
  dataTestId?: string;
  /** Applies active styling. */
  isActive?: boolean;
  /** Callback when the tab is clicked. */
  onClick: () => void;
  /** Callback when tab is closed. */
  onClose: (e: React.MouseEvent) => void;
  /** Callback when tab is double clicked. */
  onDoubleClick?: () => void;
}
