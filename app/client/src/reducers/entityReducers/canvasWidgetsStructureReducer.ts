import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { CanvasWidgetStructure } from "widgets/constants";
import { pick } from "lodash";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

export type CanvasWidgetsStructureReduxState = CanvasWidgetStructure;

// TODO (Ashit): Fix 'as'
const initialState: CanvasWidgetsStructureReduxState = {} as CanvasWidgetsStructureReduxState;

function denormalize(
  rootWidgetId: string,
  widgets: Record<string, FlattenedWidgetProps>,
): CanvasWidgetStructure {
  const rootWidget = widgets[rootWidgetId];

  const children = (rootWidget.children || []).map((childId) =>
    denormalize(childId, widgets),
  );

  const staticProps = [
    ...Object.keys(WIDGET_STATIC_PROPS),
    "isVisible",
    "isLoading",
    "isDisabled",
    "backgroundColor",
  ];

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
