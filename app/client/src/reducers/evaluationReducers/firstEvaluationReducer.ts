import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface FirstEvaluationState {
  renderPage: boolean;
  isFirstPageLoad: boolean;
}

const initialState: FirstEvaluationState = {
  renderPage: false,
  isFirstPageLoad: true,
};

export default function firstEvaluationReducer(
  state = initialState,
  action: ReduxAction<unknown>,
): FirstEvaluationState {
  switch (action.type) {
    case ReduxActionTypes.RENDER_PAGE:
      return { ...state, renderPage: true };
    case ReduxActionTypes.IS_FIRST_PAGE_LOAD:
      return { ...state, isFirstPageLoad: false };
    default:
      return state;
  }
}
