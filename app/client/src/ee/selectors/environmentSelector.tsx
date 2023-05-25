import type { AppState } from "@appsmith/reducers";

export const getEnvironmentIdByName = (state: AppState, name: string) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.name === name);
  return environment?.id;
};

export const getDefaultEnvironemntId = (state: AppState) => {
  const environments = state.environments.data;
  const environment = environments.find((env) => env.isDefault === true);
  return environment?.id;
};
