import type React from "react";

export interface EditableDismissibleTabProps {
  dataTestId?: string;
  startIcon: React.ReactNode;
  isActive: boolean;
  isEditable?: boolean;
  isLoading: boolean;
  name: string;
  onClick: () => void;
  onClose: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
}
