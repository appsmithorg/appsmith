import React from "react";

import type { CheckboxGroupState } from "@react-stately/checkbox";

export const CheckboxGroupContext =
  React.createContext<CheckboxGroupState | null>(null);
