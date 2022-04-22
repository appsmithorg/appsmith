import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { WidgetFeatures } from "utils/WidgetFeatures";
import { WidgetProps } from "./BaseWidget";

export interface WidgetConfiguration {
  type: string;
  name: string;
  iconSVG?: string;
  defaults: Partial<WidgetProps> & WidgetConfigProps;
  hideCard?: boolean;
  isCanvas?: boolean;
  needsMeta?: boolean;
  features?: WidgetFeatures;
  properties: {
    config: PropertyPaneConfig[];
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
  };
}

export const GRID_DENSITY_MIGRATION_V1 = 4;

export enum BlueprintOperationTypes {
  MODIFY_PROPS = "MODIFY_PROPS",
  ADD_ACTION = "ADD_ACTION",
  CHILD_OPERATIONS = "CHILD_OPERATIONS",
}

export type FlattenedWidgetProps = WidgetProps & {
  children?: string[];
};

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}

export enum FileDataTypes {
  Base64 = "Base64",
  Text = "Text",
  Binary = "Binary",
}

export type AlignWidget = "LEFT" | "RIGHT";

// Minimum Rows for Widget Popups
export const MinimumPopupRows = 12;
