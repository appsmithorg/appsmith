import type { IDEAppState } from "pages/IDE/ideReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setIdeAppState = (state: IDEAppState) => {
  return {
    type: ReduxActionTypes.SET_IDE_APP_STATE,
    payload: state,
  };
};
