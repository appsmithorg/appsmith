import { createReducer } from "../../utils/AppsmithUtils"
import {
  ReduxActionTypes,
  ReduxAction,
  LoadWidgetCardsPanePayload
} from "../../constants/ReduxActionConstants"
import { WidgetCardProps } from "../../widgets/BaseWidget";
import WidgetCardsPaneResponse from "../../mockResponses/WidgetCardsPaneResponse"

const initialState: WidgetCardsPaneReduxState = WidgetCardsPaneResponse

const widgetCardsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.ERROR_FETCHING_WIDGET_CARDS]: (
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
