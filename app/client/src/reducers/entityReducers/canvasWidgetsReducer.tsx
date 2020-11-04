import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { set } from "lodash";

const initialState: CanvasWidgetsReduxState = {};

export type FlattenedWidgetProps = WidgetProps & {
  children?: string[];
};

const canvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_CANVAS]: (
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
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateWidgetPropertyPayload>,
  ) => {
    set(
      state[action.payload.widgetId],
      action.payload.propertyName,
      action.payload.propertyValue,
    );
    // state[action.payload.widgetId][action.payload.propertyName] =
    //   action.payload.propertyValue;
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
