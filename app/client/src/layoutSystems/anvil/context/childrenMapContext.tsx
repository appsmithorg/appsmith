import { createContext } from "react";
import type { WidgetProps } from "widgets/BaseWidget";

export const ChildrenMapContext = createContext<Record<string, WidgetProps>>(
  {},
);
