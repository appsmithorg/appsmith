import { call, put, takeLeading, takeLatest, select } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  toggleFavoriteApplicationError,
  toggleFavoriteApplicationSuccess,
  fetchFavoriteApplicationsError,
  fetchFavoriteApplicationsSuccess,
} from "actions/applicationActions";
import { validateResponse } from "sagas/ErrorSagas";
import { toast } from "@appsmith/ads";
import { findDefaultPage } from "pages/utils";
import type { ApplicationPayload } from "entities/Application";
import type { ApiResponse } from "api/ApiResponses";
import { getApplicationList } from "ee/selectors/applicationSelectors";

const MAX_FAVORITE_APPLICATIONS_LIMIT = 50;

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

    if (
      !isFavorited &&
      currentFavoriteIds.length >= MAX_FAVORITE_APPLICATIONS_LIMIT
    ) {
      toast.show(
        `Maximum favorite applications limit (${MAX_FAVORITE_APPLICATIONS_LIMIT}) reached`,
        { kind: "error" },
      );

      return;
    }

    const newIsFavorited = !isFavorited;

    yield put(toggleFavoriteApplicationSuccess(applicationId, newIsFavorited));

    const response: ApiResponse = yield call(
      ApplicationApi.toggleFavoriteApplication,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (!isValidResponse) {
      yield put(toggleFavoriteApplicationSuccess(applicationId, isFavorited));
      yield put({ type: ReduxActionTypes.FETCH_FAVORITE_APPLICATIONS_INIT });

      return;
    }
  } catch (error: unknown) {
    yield put(toggleFavoriteApplicationSuccess(applicationId, isFavorited));

    yield put(toggleFavoriteApplicationError(applicationId, error));

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update favorite status";

    toast.show(message, { kind: "error" });
  }
}

function* fetchFavoriteApplicationsSaga() {
  try {
    const response: ApiResponse<ApplicationPayload[]> = yield call(
      ApplicationApi.getFavoriteApplications,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const rawApplications = response.data;

      // Build a permissions lookup from the main application list so favorite
      // apps returned by the API (which may omit permissions) are enriched.
      const allApplications: ApplicationPayload[] =
        (yield select(getApplicationList)) ?? [];
      const permissionsById = new Map<string, string[]>();

      for (const app of allApplications) {
        if (app.userPermissions?.length) {
          permissionsById.set(app.id, app.userPermissions);
        }
      }

      const applications = rawApplications.map(
        (application: ApplicationPayload) => {
          const defaultPage = findDefaultPage(application.pages);
          const userPermissions = application.userPermissions?.length
            ? application.userPermissions
            : permissionsById.get(application.id) ?? [];

          return {
            ...application,
            defaultPageId: defaultPage?.id,
            defaultBasePageId: defaultPage?.baseId,
            userPermissions,
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
  yield takeLeading(
    ReduxActionTypes.TOGGLE_FAVORITE_APPLICATION_INIT,
    toggleFavoriteApplicationSaga,
  );
  yield takeLatest(
    ReduxActionTypes.FETCH_FAVORITE_APPLICATIONS_INIT,
    fetchFavoriteApplicationsSaga,
  );
}
