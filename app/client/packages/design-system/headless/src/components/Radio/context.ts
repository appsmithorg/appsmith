import React, { useContext } from "react";
import type { RadioGroupState } from "@react-stately/radio";

export type RadioGroupContext = {
  name?: string;
  validationState?: "valid" | "invalid";
  state: RadioGroupState;
};

export const RadioContext = React.createContext<RadioGroupContext | null>(null);

export function useRadioProvider() {
  return useContext(RadioContext) as RadioGroupContext;
}
