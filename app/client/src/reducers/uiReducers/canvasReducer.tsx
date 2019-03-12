import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"
import { IWidgetProps } from "../../widgets/BaseWidget";
import CanvasResponse from "../../mockResponses/CanvasResponse"

const initialState: CanvasReduxState<any> = {
  canvasWidgetProps: CanvasResponse
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
