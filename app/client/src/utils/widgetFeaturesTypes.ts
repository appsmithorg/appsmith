import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import type { WidgetProps } from "widgets/types";

export enum DynamicHeight {
  AUTO_HEIGHT = "AUTO_HEIGHT",
  FIXED = "FIXED",
  AUTO_HEIGHT_WITH_LIMITS = "AUTO_HEIGHT_WITH_LIMITS",
}

export type WidgetFeatures = Record<
  RegisteredWidgetFeatures,
  WidgetFeatureConfig
>;

export enum RegisteredWidgetFeatures {
  DYNAMIC_HEIGHT = "dynamicHeight",
}

export interface WidgetFeatureConfig {
  active: boolean;
  defaultValue?: DynamicHeight;
  sectionIndex: number;
  helperText?: (props?: WidgetProps) => PropertyPaneControlConfig["helperText"];
}
