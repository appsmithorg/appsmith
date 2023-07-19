import type { AppState } from "@appsmith/reducers";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEnvironments = (state: AppState): Array<EnvironmentType> => [];
