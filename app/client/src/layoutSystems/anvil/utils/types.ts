import type {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { ReactNode } from "react";
import type { WidgetType } from "WidgetProvider/factory";

export interface AnvilFlexComponentProps {
  alignment: FlexVerticalAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  hasAutoWidth: boolean;
  hasAutoHeight: boolean;
  isResizeDisabled?: boolean;
  flexVerticalAlignment: FlexVerticalAlignment;
  focused?: boolean;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  widgetId: string;
  widgetName: string;
  widgetSize?: { [key: string]: Record<string, string | number> };
  widgetType: WidgetType;
}
