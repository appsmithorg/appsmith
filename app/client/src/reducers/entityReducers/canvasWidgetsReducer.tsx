import { createReducer } from "../../utils/AppsmithUtils"
import {
  ReduxActionTypes,
  LoadCanvasWidgetsPayload,
  ReduxAction
} from "../../constants/ReduxActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget"
import CanvasWidgetsNormalizer from "../../normalizers/CanvasWidgetsNormalizer";

const initialState: CanvasWidgetsReduxState = {}


export interface IFlattenedWidgetProps extends IWidgetProps {
  children?: string[];
}

const canvasWidgetsReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>
  ) => {
    return { ...action.payload.widgets }
  },
  [ReduxActionTypes.ADD_PAGE_WIDGET]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<{pageId: string, widget: IWidgetProps}>
  ) => {
    const widget = action.payload.widget
    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", { canvasWidgets: state })
    const children = widgetTree.children || []
    children.push(widget)
    widgetTree.children = children
    const newState =  CanvasWidgetsNormalizer.normalize({
      responseMeta: { responseCode: "SUCCESS" },
      pageWidget: widgetTree,
      pageActions: []
    }).entities
    return newState.canvasWidgets
  }
})

export interface CanvasWidgetsReduxState {
  [widgetId: string]: IFlattenedWidgetProps;
}

export default canvasWidgetsReducer
