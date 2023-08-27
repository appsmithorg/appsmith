/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "@appsmith/reducers";

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  true;

export const getCurrentEnvironmentId = (state: AppState) => "unused_env";

export const getCurrentEnvironmentName = (state: AppState) => "";

export const getCurrentEditingEnvironmentId = (state: AppState) => "unused_env";
