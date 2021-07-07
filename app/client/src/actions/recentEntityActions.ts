import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const handlePathUpdated = (location: typeof window.location) => ({
  type: ReduxActionTypes.HANDLE_PATH_UPDATED,
  payload: { location },
});
