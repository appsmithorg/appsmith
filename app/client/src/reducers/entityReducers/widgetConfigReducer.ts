import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetFeatures } from "utils/WidgetFeatures";

const initialState: WidgetConfigReducerState = { config: {} };

export type WidgetBlueprint = {
  view?: Array<{
    type: string;
    size?: { rows: number; cols: number };
    position: { top?: number; left?: number };
    props: Record<string, any>;
  }>;
  operations?: any;
};

export interface WidgetConfigProps {
  rows: number;
  columns: number;
  blueprint?: WidgetBlueprint;
  widgetName: string;
  enhancements?: Record<string, unknown>; // TODO(abhinav): SPECIFY TYPES
}

export interface WidgetConfig
  extends Partial<WidgetProps>,
    Omit<WidgetConfigProps, "widgetName"> {
  type: string;
  hideCard: boolean;
  displayName: string;
  key: string;
  isCanvas?: boolean;
  needsMeta?: boolean;
  canvasHeightOffset?: (props: WidgetProps) => number;
  features?: WidgetFeatures;
}

export interface WidgetConfigReducerState {
  config: Record<string, WidgetConfig>;
}

const widgetConfigReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_WIDGET_CONFIG]: (
    state: WidgetConfigReducerState,
    action: ReduxAction<WidgetConfig>,
  ) => {
    state.config[action.payload.type] = action.payload;
  },
});

export default widgetConfigReducer;
