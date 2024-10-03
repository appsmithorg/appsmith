import { createContext } from "react";

interface FieldProps {
  isRequired?: boolean;
  isLoading?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
}

export const FieldContext = createContext({} as FieldProps);
