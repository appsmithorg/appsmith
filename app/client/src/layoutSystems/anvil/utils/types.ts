import type { ReactNode } from "react";
import type { WidgetType } from "WidgetProvider/factory";

export interface AnvilFlexComponentProps {
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  hasAutoHeight: boolean;
  hasAutoWidth: boolean;
  isResizeDisabled?: boolean;
  focused?: boolean;
  parentId?: string;
  selected?: boolean;
  widgetId: string;
  widgetName: string;
  widgetSize?: { [key: string]: Record<string, string | number> };
  widgetType: WidgetType;
}
