import { call, put, select, takeLatest } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  toggleFavoriteApplicationSuccess,
  toggleFavoriteApplicationError,
  fetchFavoriteApplicationsSuccess,
} from "ee/actions/applicationActions";
import { validateResponse } from "sagas/ErrorSagas";
import { toast } from "@appsmith/ads";
import { findDefaultPage } from "pages/utils";

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
    // Rollback on error
    const currentFavoriteIds: string[] = yield select(
      (state) => state.ui.applications.favoriteApplicationIds,
    );
    const isFavorited = currentFavoriteIds.includes(applicationId);

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

      // Transform applications to include defaultBasePageId (needed for Launch button)
      // This matches the transformation done in ApplicationSagas.tsx
      const applications = rawApplications.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (application: any) => {
          const defaultPage = findDefaultPage(application.pages);

          return {
            ...application,
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
