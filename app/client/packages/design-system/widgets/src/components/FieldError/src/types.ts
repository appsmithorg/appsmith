import type { ValidationResult } from "react-aria-components";

export interface FieldErrorProps {
  /** The content to display as the error message. */
  errorMessage?: string | ((validation: ValidationResult) => string);
}
