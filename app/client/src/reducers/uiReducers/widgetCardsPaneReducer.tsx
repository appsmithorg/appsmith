import { createReducer } from "../../utils/AppsmithUtils"
import {
  ActionTypes,
  ReduxAction,
  LoadWidgetCardsPanePayload
} from "../../constants/ActionConstants"
import { WidgetCardProps } from "../../widgets/BaseWidget";
import WidgetCardsPaneResponse from "../../mockResponses/WidgetCardsPaneResponse"

const initialState: WidgetCardsPaneReduxState = WidgetCardsPaneResponse

const widgetCardsPaneReducer = createReducer(initialState, {
  [ActionTypes.ERROR_FETCHING_WIDGET_CARDS]: (
    state: WidgetCardsPaneReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>
  ) => {
    return { cards: action.payload.cards }
  }
})

export interface WidgetCardsPaneReduxState {
  cards: {
    [id: string]: WidgetCardProps[];
  };
}

export default widgetCardsPaneReducer
