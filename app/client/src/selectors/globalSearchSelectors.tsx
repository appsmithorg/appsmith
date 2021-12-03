import { createSelector } from "reselect";

import { AppState } from "reducers";
import { RecentEntity } from "components/editorComponents/GlobalSearch/utils";

export const getRecentEntities = (state: AppState) =>
  state.ui.globalSearch.recentEntities;

export const getRecentEntityIds = createSelector(
  getRecentEntities,
  (entities: RecentEntity[]) => {
    return entities.map((r) => r.id);
  },
);
