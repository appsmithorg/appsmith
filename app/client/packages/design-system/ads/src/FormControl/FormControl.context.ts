import { createContext, useContext } from "react";
import type { FormControlProps } from "./FormControl.types";

export const FormControlContext = createContext<
  Pick<FormControlProps, "isRequired" | "isDisabled" | "size">
>({
  isRequired: false,
  isDisabled: false,
  size: "sm",
});

export const useFormControlContext = () => {
  const context = useContext(FormControlContext);

  if (!context) {
    throw new Error(
      "FormControl compound components cannot be rendered outside the FormControl component",
    );
  }

  return context;
};

export const FormControlProvider = FormControlContext.Provider;
