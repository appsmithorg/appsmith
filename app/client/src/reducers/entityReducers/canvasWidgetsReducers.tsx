import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget"
import { RenderModes } from "../../constants/WidgetConstants"

const initialState: CanvasWidgetsReduxState = {
  "0": {
    widgetId: "0",
    widgetType: "CONTAINER_WIDGET",
    topRow: 100,
    bottomRow: 700,
    leftColumn: 100,
    rightColumn: 800,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    renderMode: RenderModes.CANVAS
  }
}

const canvasWidgetsReducer = createReducer(initialState, {
  [ActionTypes.UPDATE_CANVAS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasPayload>
  ) => {
    return { ...action.payload.widgets }
  }
})

export interface CanvasWidgetsReduxState {
  [widgetId: string]: IWidgetProps
}

export default canvasWidgetsReducer
