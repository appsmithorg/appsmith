import type React from "react";
import type { TextKind } from "../../Text";

export interface EditableEntityNameProps {
  startIcon: React.ReactNode;
  inputTestId?: string;
  isEditing: boolean;
  isLoading?: boolean;
  name: string;
  onEditComplete: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
  canEdit?: boolean;
  isFixedWidth?: boolean;
  textKind?: Extract<TextKind, "body-s" | "body-m">;
  gap?: string;
}
