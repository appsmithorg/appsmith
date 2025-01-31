import type React from "react";

export interface DismissibleTabProps {
  children: React.ReactNode;
  dataTestId?: string;
  isActive?: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}
