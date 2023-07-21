export * from "ce/actions/environmentAction";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

// Redux action to show the environment info modal before deploy
export const showEnvironmentDeployInfoModal = () => ({
  type: ReduxActionTypes.SHOW_ENV_INFO_MODAL,
});

// Redux action to initiate fetching the environment configs
export const fetchingEnvironmentConfigs = (workspaceId: string) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENT_INIT,
  payload: workspaceId,
});

// Redux action to hide the environment info modal before deploy
export const hideEnvironmentDeployInfoModal = () => ({
  type: ReduxActionTypes.HIDE_ENV_INFO_MODAL,
});
