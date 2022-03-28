import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { UpdateCanvasLayoutPayload } from "actions/controlActions";
import { set } from "lodash";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

const initialState: CanvasWidgetsReduxState = {};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

const canvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.UPDATE_CANVAS_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasLayoutPayload>,
  ) => {
    set(state[MAIN_CONTAINER_WIDGET_ID], "rightColumn", action.payload.width);
    set(state[MAIN_CONTAINER_WIDGET_ID], "minHeight", action.payload.height);
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
