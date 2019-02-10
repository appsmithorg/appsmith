import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"

const initialState: CanvasReduxState = {
  canvasWidgetProps: {
    widgetId: "0",
    widgetType: "CONTAINER_WIDGET",
    children: [
      {
        widgetId: "1",
        widgetType: "TEXT_WIDGET",
        topRow: 0,
        leftColumn: 0,
        bottomRow: 5,
        rightColumn: 5,
        parentColumnSpace: 100,
        parentRowSpace: 100
      }
    ],
    topRow: 0,
    bottomRow: 100,
    leftColumn: 0,
    rightColumn: 100,
    parentColumnSpace: 1,
    parentRowSpace: 1
  }
}

const canvasReducer = createReducer(initialState, {
  [ActionTypes.LOAD_CANVAS]: (
    state: CanvasReduxState,
    action: ReduxAction<LoadCanvasPayload>
  ) => {
    return { containerWidget: action.payload }
  }
})

export interface CanvasReduxState {
  canvasWidgetProps?: IContainerWidgetProps
}

export default canvasReducer
