import type { ReactNode } from "react";
import type { WidgetType } from "WidgetProvider/factory";
import type { SizeConfig } from "../common/hooks/useWidgetSizeConfiguration";

export interface AnvilFlexComponentProps {
  children: ReactNode;
  isResizeDisabled?: boolean;
  focused?: boolean;
  parentId?: string;
  selected?: boolean;
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
