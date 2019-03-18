import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  ReduxAction,
  LoadWidgetPanePayload
} from "../../constants/ActionConstants"
import { IWidgetProps } from "../../widgets/BaseWidget";
import WidgetPaneResponse from "../../mockResponses/WidgetPaneResponse"

const initialState: WidgetPaneReduxState = {
  widgets: WidgetPaneResponse.widgets
}

const widgetPaneReducer = createReducer(initialState, {
  [ActionTypes.LOAD_CANVAS]: (
    state: WidgetPaneReduxState,
    action: ReduxAction<LoadWidgetPanePayload>
  ) => {
    return { widgets: action.payload.widgets }
  }
})

export interface WidgetPaneReduxState {
  widgets: Partial<IWidgetProps | any>[]
}

export default widgetPaneReducer
