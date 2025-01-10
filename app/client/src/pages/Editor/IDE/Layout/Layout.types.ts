import type { AnimatedGridUnit } from "components/AnimatedGridLayout";
import type { FC } from "react";

export const Areas = {
  Sidebar: "Sidebar",
  Explorer: "Explorer",
  CodeEditor: "CodeEditor",
  WidgetEditor: "WidgetEditor",
  PropertyPane: "PropertyPane",
  BottomBar: "BottomBar",
} as const;

export type Area = keyof typeof Areas;

export interface BaseLayoutProps {
  areas: string[][];
  columns: AnimatedGridUnit[];
  rows: AnimatedGridUnit[];
  children?: React.ReactNode;
}

export interface LayoutProps extends BaseLayoutProps {
  gridUnits: AnimatedGridUnit[];
}

export interface LayoutComponentProps {
  LayoutComponent: FC<BaseLayoutProps>;
}
