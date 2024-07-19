import type { AppState } from "@appsmith/reducers";
import type { Columns } from "reducers/uiReducers/querySchemaReducer";

export const getColumnsById =
  (id: string) =>
  (state: AppState): Columns | undefined => {
    return state.ui.querySchema.meta[id];
  };
