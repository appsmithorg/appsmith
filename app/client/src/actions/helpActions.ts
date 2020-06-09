import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setHelpDefaultRefinement = (payload: string) => {
  return {
    type: ReduxActionTypes.SET_DEFAULT_REFINEMENT,
    payload,
  };
};
export const setHelpModalVisibility = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_HELP_MODAL_OPEN,
    payload,
  };
};
