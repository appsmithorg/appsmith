import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setUserCurrentGeoLocation = (position: GeolocationPosition) => {
  return {
    type: ReduxActionTypes.SET_USER_CURRENT_GEO_LOCATION,
    payload: { position },
  };
};
