import { WidgetProps } from "./BaseWidget";

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
