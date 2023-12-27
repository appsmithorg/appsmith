import React, { useContext } from "react";
import type { RadioGroupState } from "@react-stately/radio";

export interface RadioGroupContext {
  name?: string;
  validationState?: "valid" | "invalid";
  state: RadioGroupState;
  isDisabled?: boolean;
}

export const RadioContext = React.createContext<RadioGroupContext | null>(null);

export function useRadioProvider() {
  return useContext(RadioContext) as RadioGroupContext;
}
