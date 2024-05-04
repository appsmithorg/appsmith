/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "@appsmith/reducers";
import type { EnvironmentType } from "@appsmith/configs/types";
import { DEFAULT_ENV_ID } from "constants/EnvironmentContants";

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEnvironmentsWithPermission = (
  state: AppState,
): Array<EnvironmentType> => [];

export const getDefaultEnvironmentId = (state: AppState) => DEFAULT_ENV_ID;

export const getCurrentEnvironmentId = (state: AppState) => DEFAULT_ENV_ID;

export const getCurrentEnvironmentName = (state: AppState) => "";

export const getCurrentEditingEnvironmentId = (state: AppState) =>
  DEFAULT_ENV_ID;

export const getCurrentEnvironmentDetails = (state: AppState) => ({
  id: DEFAULT_ENV_ID,
  name: "",
  editingId: DEFAULT_ENV_ID,
});

export const allowManageEnvironmentAccessForUser = (state: AppState) => false;

export const isEnvironmentFetching = (state: AppState) => false;
