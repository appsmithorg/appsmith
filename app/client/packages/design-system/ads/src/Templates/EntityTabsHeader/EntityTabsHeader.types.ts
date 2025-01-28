import type React from "react";
import type { ToggleButtonProps } from "../..";

export type EntityListButtonProps = Omit<ToggleButtonProps, "icon" | "size">;

export interface EntityTabsHeaderProps {
  children: React.ReactNode;
}
