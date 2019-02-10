import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"

const initialState: CanvasReduxState = {
    canvasWidgetProps: undefined
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
