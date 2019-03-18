import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  ReduxAction,
  LoadWidgetPanePayload
} from "../../constants/ActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget";
import WidgetPaneResponse from "../../mockResponses/WidgetPaneResponse"

const initialState: WidgetPaneReduxState = WidgetPaneResponse

const widgetPaneReducer = createReducer(initialState, {
  [ActionTypes.LOAD_CANVAS]: (
    state: WidgetPaneReduxState,
    action: ReduxAction<LoadWidgetPanePayload>
  ) => {
    return { widgets: action.payload.widgets }
  }
})

export interface WidgetPaneReduxState {
  widgets: (IWidgetProps | any)[]
}

export default widgetPaneReducer
