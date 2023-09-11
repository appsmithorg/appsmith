import type { RenderMode } from "constants/WidgetConstants";
import type {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/anvil/utils/constants";
import type { ReactNode } from "react";
import type { WidgetType } from "utils/WidgetFactory";

export type AutoLayoutProps = {
  alignment: FlexLayerAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  focused?: boolean;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  isResizeDisabled?: boolean;
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  parentColumnSpace: number;
  flexVerticalAlignment: FlexVerticalAlignment;
  isMobile: boolean;
  renderMode: RenderMode;
};
