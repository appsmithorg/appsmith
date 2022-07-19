import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { pick } from "lodash";

const initialState = {};

export const WIDGET_DSL_STRUCTURE_PROPS = {
  children: true,
  type: true,
  widgetId: true,
  parentId: true,
  topRow: true,
  bottomRow: true,
};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

/**
 * Generate dsl type skeletal structure from canvas widgets
 * @param rootWidgetId
 * @param widgets
 * @returns
 */
function denormalize(
  rootWidgetId: string,
  widgets: Record<string, FlattenedWidgetProps>,
  widgetIdPathMap: Record<string, string>,
  pathFromRoot: string,
) {
  const rootWidget = widgets[rootWidgetId];

  const children = (rootWidget.children || []).map((childId, index) => {
    const path = pathFromRoot
      ? `${pathFromRoot}.children.${index}`
      : `children.${index}`;
    widgetIdPathMap[childId] = path;
    return denormalize(childId, widgets, widgetIdPathMap, path).widgetProps;
  });

  const staticProps = [...Object.keys(WIDGET_DSL_STRUCTURE_PROPS)];

  const structure = pick(rootWidget, staticProps);

  structure.children = children;
  const widgetProps = Object.assign({}, rootWidget);
  // @ts-expect-error: type issue
  widgetProps.children = children;
  return { widgetProps, structure, widgetIdPathMap };
}

const canvasWidgetsStructureReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: CanvasWidgetsStructureReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const { structure, widgetIdPathMap, widgetProps } = denormalize(
      "0",
      action.payload.widgets,
      {},
      "",
    );
    console.log("$$$", { widgetProps, widgetIdPathMap });
    return {
      widgetProps,
      structure,
      widgetIdPathMap,
    };
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsStructureReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const { structure, widgetIdPathMap, widgetProps } = denormalize(
      "0",
      action.payload.widgets,
      {},
      "",
    );
    return {
      widgetProps,
      structure,
      widgetIdPathMap,
    };
  },
});

export interface CanvasWidgetsStructureReduxState {
  widgetProps: { [widgetId: string]: FlattenedWidgetProps };
  structure: { [widgetId: string]: FlattenedWidgetProps };
  widgetIdPathMap: Record<string, string>;
}

export default canvasWidgetsStructureReducer;
