import { createSelector } from "reselect";
import type { DefaultRootState } from "react-redux";
import type { ApplicationPayload } from "entities/Application";

export const getFavoriteApplicationIds = (state: DefaultRootState) =>
  state.ui.applications.favoriteApplicationIds;

export const getFavoriteApplications = createSelector(
  [
    (state: DefaultRootState) => state.ui.applications.applicationList,
    getFavoriteApplicationIds,
  ],
  (allApps: ApplicationPayload[], favoriteIds: string[]) => {
    const favoriteApps = allApps
      .filter((app: ApplicationPayload) => favoriteIds.includes(app.id))
      .sort((a: ApplicationPayload, b: ApplicationPayload) =>
        a.name.localeCompare(b.name),
      ); // Alphabetical sort

    return favoriteApps;
  },
);

export const getHasFavorites = createSelector(
  [getFavoriteApplicationIds],
  (favoriteIds: string[]) => favoriteIds.length > 0,
);

export const getIsFetchingFavorites = (state: DefaultRootState) =>
  state.ui.applications.isFetchingFavorites;
