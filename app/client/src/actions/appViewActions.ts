import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

/**
 * ----------------------------------------------------------------------------
 * ACTIONS
 * ----------------------------------------------------------------------------
 */

/**
 * set app view header height
 *
 * @param mode
 * @returns
 */
export const setAppViewHeaderHeight = (height: number) => ({
  type: ReduxActionTypes.SET_APP_VIEWER_HEADER_HEIGHT,
  payload: height,
});
