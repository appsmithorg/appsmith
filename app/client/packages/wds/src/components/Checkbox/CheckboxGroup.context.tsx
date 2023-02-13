import { createContext, useContext } from "react";

interface CheckboxGroupContextValue {
  value: string[];
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
);
export const CheckboxGroupProvider = CheckboxGroupContext.Provider;
export const useCheckboxGroupContext = () => useContext(CheckboxGroupContext);
