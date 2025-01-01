import type { ListItemProps } from "../../../List";

export interface EntityItemProps
  extends Omit<ListItemProps, "title" | "customTitleComponent"> {
  name: string;
  /** Control the name editing behaviour */
  nameEditorConfig?: {
    // Set editable based on user permissions
    canEdit: boolean;
    // State to control the editable state of the input
    isEditing: boolean;
    // Shows a loading spinner in place of the startIcon
    isLoading: boolean;
    // Called when user attempts to save a valid name
    onEditComplete: () => void;
    // Provide a function validate the new name
    validateName: (newName: string) => string | null;
  };
}
