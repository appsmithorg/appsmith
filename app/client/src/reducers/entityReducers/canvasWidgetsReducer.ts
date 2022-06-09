import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { get, set } from "lodash";
import log from "loglevel";

/* This type is an object whose keys are widgetIds and values are arrays with property paths
and property values 
For example: 
{ "xyz123": [{ propertyPath: "bottomRow", propertyValue: 20 }] }
*/
export type UpdateWidgetsPayload = Record<
  string,
  Array<{
    propertyPath: string;
    propertyValue: unknown;
  }>
>;

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
  [ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateWidgetsPayload>,
  ) => {
    const start = performance.now();
    // For each widget whose properties we would like to update
    for (const [widgetId, propertyPathsToUpdate] of Object.entries(
      action.payload,
    )) {
      // Iterate through each property to update in `widgetId`
      propertyPathsToUpdate.forEach(({ propertyPath, propertyValue }) => {
        const path = `${widgetId}.${propertyPath}`;
        // Get original value in reducer
        const originalPropertyValue = get(state, path);
        // If the original and new values are different
        if (propertyValue !== originalPropertyValue)
          // Set the new values
          set(state, path, propertyValue);
      });
    }
    log.debug(
      "Dynamic Height: Update redux store took:",
      performance.now() - start,
      "ms",
    );
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
