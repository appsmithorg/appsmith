import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const handlePathUpdated = (pathName: string) => ({
  type: ReduxActionTypes.HANDLE_PATH_UPDATED,
  payload: { pathName },
});
