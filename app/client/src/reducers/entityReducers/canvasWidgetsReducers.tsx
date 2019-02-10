import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  LoadCanvasPayload,
  ReduxAction
} from "../../constants/ActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget";

const initialState: CanvasWidgetsReduxState = {

}

const canvasWidgetsReducer = createReducer(
  initialState,
  {
    [ActionTypes.LOAD_CANVAS]: (
      state: CanvasWidgetsReduxState,
      action: ReduxAction<LoadCanvasPayload>
    ) => {
      return { ...action.payload }
    }
  }
)

export interface CanvasWidgetsReduxState {
  [widgetId: string]: IWidgetProps
}

export default canvasWidgetsReducer
