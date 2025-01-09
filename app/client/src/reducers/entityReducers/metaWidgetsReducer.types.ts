import type { WidgetProps } from "../../widgets/BaseWidget";
import type { BatchPropertyUpdatePayload } from "../../actions/controlActions";
import type { UpdateWidgetsPayload } from "./canvasWidgetsReducer.types";

export interface MetaWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

export interface ModifyMetaWidgetPayload {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  deleteIds: string[];
  propertyUpdates?: MetaWidgetPropertyUpdate[];
  creatorId?: string;
}

export interface UpdateMetaWidgetPropertyPayload {
  updates: BatchPropertyUpdatePayload;
  widgetId: string;
  creatorId?: string;
}

export interface DeleteMetaWidgetsPayload {
  creatorIds: string[];
}

interface MetaWidgetPropertyUpdate {
  path: string;
  value: unknown;
}
