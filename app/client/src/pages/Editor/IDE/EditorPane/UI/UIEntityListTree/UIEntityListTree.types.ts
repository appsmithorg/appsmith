import type { ListItemProps } from "@appsmith/ads";
import type { WidgetType } from "constants/WidgetConstants";

export interface UIEntityListTreeProps {
  className?: string;
}

export interface WidgetTreeItem extends ListItemProps {
  widgetId: string;
  widgetType: WidgetType;
  children?: WidgetTreeItem[];
}

export interface WidgetTreeConfig {
  canManagePages: boolean;
  isFeatureEnabled: boolean;
}
