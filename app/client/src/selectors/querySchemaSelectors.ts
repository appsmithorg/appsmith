import type { AppState } from "@appsmith/reducers";

export const getColumnsById = (id: string) => (state: AppState) => {
  return state.ui.querySchema.meta[id];
};
