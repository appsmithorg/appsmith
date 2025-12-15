import { call, put, select, takeLatest } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  toggleFavoriteApplicationSuccess,
  toggleFavoriteApplicationError,
  fetchFavoriteApplicationsSuccess,
} from "actions/applicationActions";
import { validateResponse } from "sagas/ErrorSagas";
import { toast } from "@appsmith/ads";
import { findDefaultPage } from "pages/utils";
import type { ApplicationPayload } from "entities/Application";

function* toggleFavoriteApplicationSaga(
  action: ReduxAction<{ applicationId: string }>,
) {
  const { applicationId } = action.payload;

  try {
    // Optimistic update - get current state
    const currentFavoriteIds: string[] = yield select(
      (state) => state.ui.applications.favoriteApplicationIds,
    );
    const isFavorited = currentFavoriteIds.includes(applicationId);
    const newIsFavorited = !isFavorited;

    // Immediate UI update (optimistic)
    yield put(toggleFavoriteApplicationSuccess(applicationId, newIsFavorited));

    // API call
    const response: unknown = yield call(
      ApplicationApi.toggleFavoriteApplication,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (!isValidResponse) {
      // Rollback on error
      yield put(toggleFavoriteApplicationSuccess(applicationId, isFavorited));
      yield put(toggleFavoriteApplicationError(applicationId));
    }
  } catch (error) {
    // Rollback on error using the original isFavorited value captured above.
    // Do NOT re-read state here, since the optimistic update has already modified it.
    yield put(toggleFavoriteApplicationSuccess(applicationId, isFavorited));
    yield put(toggleFavoriteApplicationError(applicationId));

    toast.show("Failed to update favorite status", { kind: "error" });
  }
}

function* fetchFavoriteApplicationsSaga() {
  try {
    const response: unknown = yield call(
      ApplicationApi.getFavoriteApplications,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawApplications = (response as any).data;

      // Merge in userPermissions from the main application list when available
      // so favorites behave exactly like the standard workspace view for edit/delete/etc.
      const allApplications: ApplicationPayload[] = yield select(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state: any) => state.ui.applications.applicationList,
      );

      // Transform applications to include defaultBasePageId (needed for Launch button)
      // This matches the transformation done in ApplicationSagas.tsx
      const applications = rawApplications.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (application: any) => {
          const defaultPage = findDefaultPage(application.pages);

          // Find the corresponding application from the main list (if loaded)
          const existing = allApplications?.find(
            (app) => app.id === application.id,
          );

          return {
            ...application,
            // Prefer userPermissions from the main application list so edit
            // permissions match the regular workspace cards.
            userPermissions:
              existing?.userPermissions ?? application.userPermissions,
            defaultPageId: defaultPage?.id,
            defaultBasePageId: defaultPage?.baseId,
          };
        },
      );

      yield put(fetchFavoriteApplicationsSuccess(applications));
    }
  } catch (error) {
    // Silent fail - favorites are not critical
  }
}

export default function* favoritesSagasListener() {
  yield takeLatest(
    ReduxActionTypes.TOGGLE_FAVORITE_APPLICATION_INIT,
    toggleFavoriteApplicationSaga,
  );
  yield takeLatest(
    ReduxActionTypes.FETCH_FAVORITE_APPLICATIONS_INIT,
    fetchFavoriteApplicationsSaga,
  );
}
