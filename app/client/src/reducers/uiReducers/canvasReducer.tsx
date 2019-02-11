import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"
import { IWidgetProps } from "../../widgets/BaseWidget";

const initialState: CanvasReduxState<any> = {
  canvasWidgetProps: {
    widgetId: "0",
    widgetType: "CONTAINER_WIDGET",
    children: [
      {
        widgetId: "1",
        widgetType: "TEXT_WIDGET",
        topRow: 0,
        leftColumn: 2,
        bottomRow: 5,
        rightColumn: 5,
        parentColumnSpace: 100,
        parentRowSpace: 100,
        text: "whaat"
      }
    ],
    topRow: 0,
    bottomRow: 600,
    leftColumn: 0,
    rightColumn: 1200,
    parentColumnSpace: 1,
    parentRowSpace: 1
  }
}

const canvasReducer = createReducer(initialState, {
  [ActionTypes.LOAD_CANVAS]: (
    state: CanvasReduxState<any>,
    action: ReduxAction<LoadCanvasPayload>
  ) => {
    return { containerWidget: action.payload }
  }
})

export interface CanvasReduxState<T extends IWidgetProps> {
  canvasWidgetProps?: IContainerWidgetProps<any>
}

export default canvasReducer
