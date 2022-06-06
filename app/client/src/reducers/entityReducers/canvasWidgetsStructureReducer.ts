import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps, WIDGET_DISPLAY_PROPS } from "widgets/BaseWidget";
import { CanvasWidgetStructure } from "widgets/constants";
import { pick } from "lodash";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";

const initialState: CanvasWidgetsReduxState = {};

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
    ...Object.keys(WIDGET_DISPLAY_PROPS),
    ...[
      "componentHeight",
      "componentWidth",
      "positionType",
      "xPosition",
      "yPosition",
      "xPositionUnit",
      "yPositionUnit",
      "heightUnit",
      "widthUnit",
      "key",
    ],
  ];

  const structure = pick(rootWidget, staticProps);
  // const { type, widgetId, widgetName } = rootWidget;

  structure.children = children;
  // eslint-disable-next-line
  // @ts-ignore
  return structure;
}

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

const canvasWidgetsStructureReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    // return action.payload.widgets;
    return denormalize("0", action.payload.widgets);
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    // return action.payload.widgets;
    return denormalize("0", action.payload.widgets);
  },
});

export default canvasWidgetsStructureReducer;
