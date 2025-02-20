import type React from "react";

export interface EditableEntityNameProps {
  /** Controls if name can be edited. */
  canEdit: boolean;
  /** Icon component. */
  icon: React.ReactNode;
  /** Used for passing data-testid to input. */
  inputTestId?: string;
  /** Toggles editing mode. */
  isEditing: boolean;
  /** Controls if name is fixed width. */
  isFixedWidth?: boolean;
  /** Shows loading indicator in place of an icon. */
  isLoading?: boolean;
  /** The name of the entity. */
  name: string;
  /** Size of the icon & input. */
  size?: "small" | "medium";
  /** Callback when editing is exited. */
  onExitEditing: () => void;
  /** Callback when name is saved. */
  onNameSave: (name: string) => void;
  /** Function to validate the name. */
  validateName: (name: string) => string | null;
  /** Whether a name should be normalized on renaming */
  normalizeName?: boolean;
}
