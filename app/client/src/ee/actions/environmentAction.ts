import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchingEnvironmentConfigs = (workspaceId: string) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
  payload: workspaceId,
});
