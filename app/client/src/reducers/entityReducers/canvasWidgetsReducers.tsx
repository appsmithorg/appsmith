import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget"
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";

const initialState: CanvasWidgetsReduxState = {}


export interface IFlattenedWidgetProps extends IWidgetProps {
  children?: string[];
}

const canvasWidgetsReducer = createReducer(initialState, {
  [ActionTypes.UPDATE_CANVAS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasPayload>
  ) => {
    return { ...action.payload.widgets }
  },
  [ActionTypes.ADD_PAGE_WIDGET]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<{pageId: string, widget: IWidgetProps}>
  ) => {
    const widget = action.payload.widget
    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", { canvasWidgets: state })
    const children = widgetTree.children || []
    children.push(widget)
    widgetTree.children = children
    const newState =  CanvasWidgetsNormalizer.normalize({
      responseMeta: {},
      pageWidget: widgetTree
    }).entities
    return newState.canvasWidgets
  }
})

export interface CanvasWidgetsReduxState {
  [widgetId: string]: IFlattenedWidgetProps;
}

export default canvasWidgetsReducer
