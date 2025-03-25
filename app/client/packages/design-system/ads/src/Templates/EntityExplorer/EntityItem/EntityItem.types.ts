import type { ListItemProps } from "../../../List";
import type { StatusIndicator } from "../../EditableEntityName/EditableEntityName.types";
export interface EntityItemProps
  extends Omit<
    ListItemProps,
    "customTitleComponent" | "description" | "descriptionType"
  > {
  /** ID of the entity. Will be added to the markup for identification */
  id: string;
  /** status indicator for the list item */
  statusIndicator?: StatusIndicator;
  /** Control the name editing behaviour */
  nameEditorConfig: {
    // Set editable based on user permissions
    canEdit: boolean;
    // State to control the editable state of the input
    isEditing: boolean;
    // Shows a loading spinner in place of the startIcon
    isLoading: boolean;
    // Called to request the editing mode to end
    onEditComplete: () => void;
    // Called to save the new name
    onNameSave: (newName: string) => void;
    // Provide a function validate the new name
    validateName: (newName: string) => string | null;
    // Whether entity name should be normalized on renaming
    normalizeName?: boolean;
  };
}
