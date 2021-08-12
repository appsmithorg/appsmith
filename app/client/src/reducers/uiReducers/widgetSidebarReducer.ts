import { createReducer } from "utils/AppsmithUtils";
import { WidgetCardProps } from "widgets/BaseWidget";
import WidgetSidebarResponse from "mockResponses/WidgetSidebarResponse";
import {
  LoadWidgetSidebarPayload,
  ReduxAction,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { EditorReduxState } from "./editorReducer";

export interface WidgetSidebarReduxState {
  cards: WidgetCardProps[];
  forceOpen: boolean;
}

const initialState: WidgetSidebarReduxState = {
  cards: WidgetSidebarResponse,
  forceOpen: false,
};

export const widgetSidebarReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_WIDGET_CARDS_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetSidebarPayload>,
  ) => {
    return { ...state, ...action.payload };
  },
  [ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN]: (
    state: EditorReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, forceOpen: action.payload };
  },
});
