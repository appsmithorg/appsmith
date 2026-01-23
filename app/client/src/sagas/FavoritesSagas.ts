import { call, put, takeLatest, select } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  toggleFavoriteApplicationSuccess,
  toggleFavoriteApplicationError,
  fetchFavoriteApplicationsError,
  fetchFavoriteApplicationsSuccess,
} from "actions/applicationActions";
import { validateResponse } from "sagas/ErrorSagas";
import { toast } from "@appsmith/ads";
import { findDefaultPage } from "pages/utils";
import type { ApplicationPayload } from "entities/Application";
import type { ApiResponse } from "api/ApiResponses";

function* toggleFavoriteApplicationSaga(
  action: ReduxAction<{ applicationId: string }>,
) {
  const { applicationId } = action.payload;
  let isFavorited: boolean = false;

  try {
    const currentFavoriteIds: string[] = yield select(
      (state) => state.ui.applications.favoriteApplicationIds,
    );

    isFavorited = currentFavoriteIds.includes(applicationId);
    const newIsFavorited = !isFavorited;

    yield put(toggleFavoriteApplicationSuccess(applicationId, newIsFavorited));

    const response: unknown = yield call(
      ApplicationApi.toggleFavoriteApplication,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (!isValidResponse) {
      yield put(toggleFavoriteApplicationSuccess(applicationId, isFavorited));
      yield put(toggleFavoriteApplicationError(applicationId));
    }
  } catch (error) {
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
      const rawApplications = (response as ApiResponse<ApplicationPayload[]>)
        .data;

      const applications = rawApplications.map(
        (application: ApplicationPayload) => {
          const defaultPage = findDefaultPage(application.pages);

          return {
            ...application,
            defaultPageId: defaultPage?.id,
            defaultBasePageId: defaultPage?.baseId,
          };
        },
      );

      yield put(fetchFavoriteApplicationsSuccess(applications));
    } else {
      yield put(fetchFavoriteApplicationsError());
    }
  } catch (error) {
    yield put(fetchFavoriteApplicationsError());
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
