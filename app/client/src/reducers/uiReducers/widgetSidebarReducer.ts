import { createReducer } from "../../utils/AppsmithUtils";
import { WidgetCardProps } from "../../widgets/BaseWidget";
import WidgetSidebarResponse from "../../mockResponses/WidgetSidebarResponse";
import {
  LoadWidgetSidebarPayload,
  ReduxAction,
  ReduxActionTypes,
} from "../../constants/ReduxActionConstants";
import { EditorReduxState } from "./editorReducer";

export interface WidgetSidebarReduxState {
  cards: { [id: string]: WidgetCardProps[] };
}

const initialState: WidgetSidebarReduxState = {
  cards: WidgetSidebarResponse,
};

export const widgetSidebarReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_WIDGET_CARDS_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetSidebarPayload>,
  ) => {
    return { ...state, ...action.payload };
  },
});
