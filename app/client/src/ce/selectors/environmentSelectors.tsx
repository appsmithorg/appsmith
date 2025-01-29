/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "ee/reducers";
import type { EnvironmentType } from "ee/configs/types";
import { UNUSED_ENV_ID } from "constants/EnvironmentContants";
export { getCurrentEnvironmentName } from "ee/selectors/dataTreeCyclicSelectors";

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEnvironmentsWithPermission = (
  state: AppState,
): Array<EnvironmentType> => [];

export const getDefaultEnvironmentId = (state: AppState) => UNUSED_ENV_ID;

export const getCurrentEnvironmentId = (state: AppState) => UNUSED_ENV_ID;

export const getCurrentEditingEnvironmentId = (state: AppState) =>
  UNUSED_ENV_ID;

export const getCurrentEnvironmentDetails = (state: AppState) => ({
  id: UNUSED_ENV_ID,
  name: "",
  editingId: UNUSED_ENV_ID,
});

export const allowManageEnvironmentAccessForUser = (state: AppState) => false;

export const isEnvironmentFetching = (state: AppState) => false;
