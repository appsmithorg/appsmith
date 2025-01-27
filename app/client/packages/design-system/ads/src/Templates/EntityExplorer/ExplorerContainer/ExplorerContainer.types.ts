import { type ReactNode } from "react";
import type { ExplorerContainerBorder } from "./ExplorerContainer.constants";

export interface ExplorerContainerProps {
  children: ReactNode | ReactNode[];
  borderRight: keyof typeof ExplorerContainerBorder;
  className?: string;
  width?: string | number;
  height?: string | number;
}
