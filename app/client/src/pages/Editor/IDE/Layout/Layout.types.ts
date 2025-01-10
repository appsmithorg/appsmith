import type { AnimatedGridUnit } from "components/AnimatedGridLayout";

export const Areas = {
  Sidebar: "Sidebar",
  Explorer: "Explorer",
  CodeEditor: "CodeEditor",
  WidgetEditor: "WidgetEditor",
  PropertyPane: "PropertyPane",
  BottomBar: "BottomBar",
} as const;

export type Area = keyof typeof Areas;

export interface LayoutProps {
  gridUnits: AnimatedGridUnit[];
}
