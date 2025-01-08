import type { MouseEvent, ReactNode } from "react";

export interface FileTabProps {
  isActive: boolean;
  title: string;
  onClick: () => void;
  onClose: (e: MouseEvent) => void;
  children: ReactNode;
  onDoubleClick?: () => void;
}
