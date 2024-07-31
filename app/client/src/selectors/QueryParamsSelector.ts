import type { AppState } from "@appsmith/reducers";

export const getQueryParams = (appState: AppState, id: string | undefined) => {
  if (id === undefined) {
    return undefined;
  }
  const params = appState.entities.queryParams;
  if (id in params) {
    return params[id];
  } else {
    return undefined;
  }
};
