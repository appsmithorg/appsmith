import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { LanguageEnums } from "entities/App";

export type ChangeLanguageAction = {
  lang: LanguageEnums;
};

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

/**
 * set language for app
 *
 * @returns
 */
export const setLanguageAction = (payload: ChangeLanguageAction) => {
  return {
    type: ReduxActionTypes.CHANGE_LANGUAGE,
    payload: payload.lang,
  };
};
