export interface FieldProps {
  /** Error message to display when the field has an error */
  errorMessage?: string;
  /** Label text for the field */
  label?: string;
  /** Additional help text that is displayed in a tooltip beside label */
  contextualHelp?: string;
  /** Indicates whether the field is in a loading state */
  isLoading?: boolean;
}
