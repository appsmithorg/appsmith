import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

// Redux action to initiate fetching the environment configs
export const fetchingEnvironmentConfigs = (workspaceId: string) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
  payload: workspaceId,
});
