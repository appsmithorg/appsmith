import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const updateOneClickBindingOptionsVisibility = (
  visibility: boolean,
) => ({
  type: ReduxActionTypes.SET_ONE_CLICK_BINDING_OPTIONS_VISIBILITY,
  payload: visibility,
});
