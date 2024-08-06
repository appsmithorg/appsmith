import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const setUserCurrentGeoLocation = (position: GeolocationPosition) => {
  return {
    type: ReduxActionTypes.SET_USER_CURRENT_GEO_LOCATION,
    payload: { position },
  };
};
