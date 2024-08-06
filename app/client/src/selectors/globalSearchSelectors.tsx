import { createSelector } from "reselect";

import type { AppState } from "ee/reducers";
import type { RecentEntity } from "components/editorComponents/GlobalSearch/utils";

export const getRecentEntities = (state: AppState) =>
  state.ui.globalSearch.recentEntities;

export const getRecentEntityIds = createSelector(
  getRecentEntities,
  (entities: RecentEntity[]) => {
    return entities.map((r) => r.id);
  },
);
