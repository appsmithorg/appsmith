import { APP_SIDEBAR_WIDTH } from "constants/AppConstants";
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

export const SIDEBAR_WIDTH = (APP_SIDEBAR_WIDTH + "px") as AnimatedGridUnit;
