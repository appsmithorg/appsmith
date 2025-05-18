import { createSelector } from "reselect";

import type { DefaultRootState } from "react-redux";
import type { RecentEntity } from "components/editorComponents/GlobalSearch/utils";

export const getRecentEntities = (state: DefaultRootState) =>
  state.ui.globalSearch.recentEntities;

export const getRecentEntityIds = createSelector(
  getRecentEntities,
  (entities: RecentEntity[]) => {
    return entities.map((r) => r.id);
  },
);
