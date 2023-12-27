import React from "react";

import type { CheckboxGroupState } from "@react-stately/checkbox";

export interface CheckboxGroupContextType {
  state: CheckboxGroupState;
  isDisabled?: boolean;
}

export const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextType | null>(null);
