import type { ReactNode } from "react";
import type { SizeConfig } from "WidgetProvider/constants";
import type { WidgetType } from "WidgetProvider/factory";

export interface AnvilFlexComponentProps {
  children: ReactNode;
  isResizeDisabled?: boolean;
  layoutId: string;
  focused?: boolean;
  parentId?: string;
  rowIndex: number;
  selected?: boolean;
  isVisible: boolean;
  widgetId: string;
  widgetName: string;
  widgetSize?: SizeConfig;
  widgetType: WidgetType;
}

export type PositionValues =
  | "absolute"
  | "relative"
  | "fixed"
  | "sticky"
  | "static";

export type OverflowValues = "hidden" | "scroll" | "visible" | "auto";
