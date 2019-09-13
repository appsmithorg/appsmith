import { createReducer } from "../../utils/AppsmithUtils";
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction,
} from "../../constants/ActionConstants";
import { WidgetProps } from "../../widgets/BaseWidget";
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";

const initialState: CanvasWidgetsReduxState = {};

export interface FlattenedWidgetProps extends WidgetProps {
  children?: string[];
}

const canvasWidgetsReducer = createReducer(initialState, {
  [ActionTypes.UPDATE_CANVAS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasPayload>,
  ) => {
    return { ...action.payload.widgets };
  },
  [ActionTypes.ADD_PAGE_WIDGET]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<{ pageId: string; widget: WidgetProps }>,
  ) => {
    const widget = action.payload.widget;
    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets: state,
    });
    const children = widgetTree.children || [];
    children.push(widget);
    widgetTree.children = children;
    const newState = CanvasWidgetsNormalizer.normalize({
      responseMeta: {},
      pageWidget: widgetTree,
    }).entities;
    return newState.canvasWidgets;
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
