import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

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
}

export interface WidgetConfigReducerState {
  config: Record<
    string,
    Partial<WidgetProps> & WidgetConfigProps & { type: string }
  >;
}

const widgetConfigReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_WIDGET_CONFIG]: (
    state: WidgetConfigReducerState,
    action: ReduxAction<
      Partial<WidgetProps> & WidgetConfigProps & { type: string }
    >,
  ) => {
    state.config[action.payload.type] = action.payload;
  },
});

export default widgetConfigReducer;
