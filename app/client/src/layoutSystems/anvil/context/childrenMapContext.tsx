import { createContext } from "react";
import type { WidgetProps } from "widgets/types";

export const ChildrenMapContext = createContext<Record<string, WidgetProps>>(
  {},
);
