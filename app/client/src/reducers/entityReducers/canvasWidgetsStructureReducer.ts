import { createImmerReducer } from "utils/ReducerUtils";
import type {
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { CANVAS_DEFAULT_MIN_ROWS } from "constants/AppConstants";
import { denormalize } from "utils/canvasStructureHelpers";

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

export type CanvasWidgetsStructureReduxState = {
  children?: CanvasWidgetsStructureReduxState[];
  type: WidgetType;
  widgetId: string;
  parentId?: string;
  bottomRow: number;
  topRow: number;
};

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
});

export default canvasWidgetsStructureReducer;
