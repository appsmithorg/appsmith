import React from "react";

import type { CheckboxGroupState } from "@react-stately/checkbox";
import type { InlineLabelProps } from "./Checkbox";

export interface CheckboxGroupContextType {
  state: CheckboxGroupState;
  isDisabled?: boolean;
  optionsLabelPosition?: InlineLabelProps["labelPosition"];
}

export const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextType | null>(null);
