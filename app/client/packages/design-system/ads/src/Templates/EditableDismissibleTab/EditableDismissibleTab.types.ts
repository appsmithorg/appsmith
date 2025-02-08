import type React from "react";

export interface EditableDismissibleTabProps {
  /** Used for passing data-testid. */
  dataTestId?: string;
  /** Icon component to be displayed in the tab. */
  icon: React.ReactNode;
  /** Passed to tab component, applies active state/styles. */
  isActive: boolean;
  /** Controls if tab can be edited. */
  isEditable?: boolean;
  /** Can be passed to control editing state externally. */
  isEditing?: boolean;
  /** Shows loading indicator in place of an icon. */
  isLoading: boolean;
  /** The name of the tab. */
  name: string;

  /** Callback when the tab is clicked. */
  onClick: () => void;
  /** Callback when tab is closed. */
  onClose: () => void;
  /** Callback when tab enters edit mode. */
  onEnterEditMode?: () => void;
  /** Callback when tab exits edit mode. */
  onExitEditMode?: () => void;
  /** Callback when tab name is saved. */
  onNameSave: (name: string) => void;
  /** Function to validate the name. */
  validateName: (name: string) => string | null;
}
