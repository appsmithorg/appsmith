import type { ReactNode } from "react";
import type { SizeConfig } from "WidgetProvider/constants";
import type { WidgetType } from "WidgetProvider/factory";

export interface AnvilFlexComponentProps {
  children: ReactNode;
  className?: string;
  layoutId: string;
  parentId?: string;
  rowIndex: number;
  flexGrow?: number;
  isVisible: boolean;
  widgetId: string;
  widgetName: string;
  widgetSize?: SizeConfig;
  widgetType: WidgetType;
  onClick?: (e: any) => void;
  onClickCapture?: React.MouseEventHandler;
}

export type PositionValues =
  | "absolute"
  | "relative"
  | "fixed"
  | "sticky"
  | "static";

export type OverflowValues = "hidden" | "scroll" | "visible" | "auto";
