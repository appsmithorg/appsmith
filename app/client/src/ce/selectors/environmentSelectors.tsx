/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DefaultRootState } from "react-redux";
import type { EnvironmentType } from "ee/configs/types";
import { UNUSED_ENV_ID } from "constants/EnvironmentContants";

export const areEnvironmentsFetched = (
  state: DefaultRootState,
  workspaceId: string,
) => true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEnvironmentsWithPermission = (
  state: DefaultRootState,
): Array<EnvironmentType> => [];

export const getDefaultEnvironmentId = (state: DefaultRootState) =>
  UNUSED_ENV_ID;

export const getCurrentEnvironmentId = (state: DefaultRootState) =>
  UNUSED_ENV_ID;

export const getCurrentEnvironmentName = (state: DefaultRootState) => "";

export const getCurrentEditingEnvironmentId = (state: DefaultRootState) =>
  UNUSED_ENV_ID;

export const getCurrentEnvironmentDetails = (state: DefaultRootState) => ({
  id: UNUSED_ENV_ID,
  name: "",
  editingId: UNUSED_ENV_ID,
});

export const allowManageEnvironmentAccessForUser = (state: DefaultRootState) =>
  false;

export const isEnvironmentFetching = (state: DefaultRootState) => false;
