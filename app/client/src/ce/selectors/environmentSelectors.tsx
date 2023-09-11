/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "@appsmith/reducers";

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEnvironmentsWithPermission = (state: AppState) => [];

export const getDefaultEnvironmentId = (state: AppState) => "unused_env";

export const getCurrentEnvironmentId = (state: AppState) => "unused_env";

export const getCurrentEnvironmentName = (state: AppState) => "";

export const getCurrentEditingEnvironmentId = (state: AppState) => "unused_env";

export const getCurrentEnvironmentDetails = (state: AppState) => ({
  id: "unused_env",
  name: "",
  editingId: "unused_env",
});
