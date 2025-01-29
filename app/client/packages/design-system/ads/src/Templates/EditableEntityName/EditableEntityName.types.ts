import type React from "react";

export interface EditableEntityNameProps {
  icon: React.ReactNode;
  inputTestId?: string;
  isEditing: boolean;
  isLoading?: boolean;
  name: string;
  onExitEditing: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
  canEdit?: boolean;
  isFixedWidth?: boolean;
  size?: "small" | "medium";
}
