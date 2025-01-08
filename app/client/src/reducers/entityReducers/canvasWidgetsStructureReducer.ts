import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { CANVAS_DEFAULT_MIN_ROWS } from "constants/AppConstants";
import { denormalize } from "utils/canvasStructureHelpers";
import { klona } from "klona";
import type { UpdateCanvasPayload } from "actions/pageActions";
import type { CanvasWidgetsStructureReduxState, FlattenedWidgetProps } from "./canvasWidgetsStructureReducer.types";

const initialState: CanvasWidgetsStructureReduxState = {
  type: "CANVAS_WIDGET",
  widgetId: MAIN_CONTAINER_WIDGET_ID,
  topRow: 0,
  bottomRow: CANVAS_DEFAULT_MIN_ROWS,
};

const canvasWidgetsStructureReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: CanvasWidgetsStructureReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return denormalize("0", action.payload.widgets);
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsStructureReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return denormalize("0", action.payload.widgets);
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
});

export default canvasWidgetsStructureReducer;
