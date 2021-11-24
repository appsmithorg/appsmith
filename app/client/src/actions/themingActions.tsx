import { ThemingMode } from "selectors/themingSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

/**
 * set theming mode
 *
 * @param mode
 * @returns
 */
export const setThemingMode = (mode: ThemingMode) => ({
  type: ReduxActionTypes.SET_THEMING_MODE,
  payload: mode,
});
