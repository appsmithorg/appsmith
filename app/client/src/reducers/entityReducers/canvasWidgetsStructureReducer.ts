import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { CanvasWidgetStructure } from "widgets/constants";
import { pick } from "lodash";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetType,
  WIDGET_DSL_STRUCTURE_PROPS,
} from "constants/WidgetConstants";
import { CANVAS_DEFAULT_MIN_ROWS } from "constants/AppConstants";

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

/**
 * Generate dsl type skeletal structure from canvas widgets
 * @param rootWidgetId
 * @param widgets
 * @returns
 */
function denormalize(
  rootWidgetId: string,
  widgets: Record<string, FlattenedWidgetProps>,
): CanvasWidgetStructure {
  const rootWidget = widgets[rootWidgetId];

  const children = (rootWidget.children || []).map((childId) =>
    denormalize(childId, widgets),
  );

  const staticProps = Object.keys(WIDGET_DSL_STRUCTURE_PROPS);

  const structure = pick(rootWidget, staticProps) as CanvasWidgetStructure;

  structure.children = children;

  return structure;
}

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
