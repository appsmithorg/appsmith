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
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateWidgetPropertyPayload>,
  ) => {
    const { dynamicUpdates, updates, widgetId } = action.payload;
    // We loop over all updates
    Object.entries(updates).forEach(([propertyPath, propertyValue]) => {
      // since property paths could be nested, we use lodash set method
      set(state[widgetId], propertyPath, propertyValue);
    });

    if (dynamicUpdates && dynamicUpdates.dynamicBindingPathList.length) {
      const currentList = state[widgetId].dynamicBindingPathList || [];
      state[widgetId].dynamicBindingPathList = Array.from(
        new Set(currentList.concat(dynamicUpdates.dynamicBindingPathList)),
      );
    }
    if (dynamicUpdates && dynamicUpdates.dynamicTriggerPathList.length) {
      const currentList = state[widgetId].dynamicTriggerPathList || [];
      state[widgetId].dynamicTriggerPathList = Array.from(
        new Set(currentList.concat(dynamicUpdates.dynamicTriggerPathList)),
      );
    }
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
