import type React from "react";

export interface EditableDismissibleTabProps {
  canEdit: boolean;
  dataTestId?: string;
  icon: React.ReactNode;
  isActive: boolean;
  isEditable?: boolean;
  isEditing?: boolean;
  isLoading: boolean;
  name: string;
  onClick: () => void;
  onClose: () => void;
  onEnterEditMode?: () => void;
  onExitEditMode?: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
}
