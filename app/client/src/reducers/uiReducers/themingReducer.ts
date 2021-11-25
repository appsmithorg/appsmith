import { createImmerReducer } from "utils/AppsmithUtils";
import { ThemingMode } from "selectors/themingSelectors";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: ThemingState = {
  mode: ThemingMode.THEME_EDIT,
};

export type ThemingState = {
  mode: ThemingMode;
};

const themeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_THEMING_MODE]: (
    state: ThemingState,
    action: ReduxAction<ThemingMode>,
  ) => {
    state.mode = action.payload;
  },
});

export default themeReducer;
