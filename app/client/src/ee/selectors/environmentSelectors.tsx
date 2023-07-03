export * from "ce/selectors/environmentSelectors";
import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";
import type { AppState } from "@appsmith/reducers";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";

export const getEnvironmentByName = (state: AppState, name: string) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.name === name);
  return environment;
};

export const getEnvironmentById = (state: AppState, id: string) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.id === id);
  return environment;
};

export const getEnvironmentIdByName = (state: AppState, name: string) => {
  if (name === DEFAULT_ENV_ID) return name;
  const environments = state.environments.data;
  const environment = environments.find((env) => env.name === name);
  return environment?.id || DEFAULT_ENV_ID;
};

export const getDefaultEnvironmentId = (state: AppState) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.isDefault === true);
  return environment?.id;
};

export const getDefaultEnvironment = (state: AppState) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.isDefault === true);
  return environment;
};

export const getEnvironments = (state: AppState): Array<EnvironmentType> =>
  state.environments.data;

export const areEnvironmentsFetched = (state: AppState, workspaceId: string) =>
  state.environments.data.length > 0 &&
  state.environments.data[0].workspaceId === workspaceId;
