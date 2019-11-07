import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  ApplicationPayload,
} from "../constants/ReduxActionConstants";
import ApplicationApi, {
  PublishApplicationResponse,
  PublishApplicationRequest,
  FetchApplicationsResponse,
  CreateApplicationRequest,
  CreateApplicationResponse,
  ApplicationPagePayload,
} from "../api/ApplicationApi";
import { call, put, takeLatest, all } from "redux-saga/effects";

import { validateResponse } from "./ErrorSagas";

export function* publishApplicationSaga(
  requestAction: ReduxAction<PublishApplicationRequest>,
) {
  try {
    const request = requestAction.payload;
    const response: PublishApplicationResponse = yield call(
      ApplicationApi.publishApplication,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

const getDefaultPageId = (
  pages?: ApplicationPagePayload[],
): string | undefined => {
  let defaultPage: ApplicationPagePayload | undefined = undefined;
  if (pages) {
    pages.find(page => page.isDefault);
    if (!defaultPage) {
      defaultPage = pages[0];
    }
  }
  return defaultPage ? defaultPage.id : undefined;
};

export function* fetchApplicationListSaga() {
  try {
    const response: FetchApplicationsResponse = yield call(
      ApplicationApi.fetchApplications,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const applicationListPayload: ApplicationPayload[] = response.data.map(
        application => ({
          name: application.name,
          organizationId: application.organizationId,
          id: application.id,
          pageCount: application.pages ? application.pages.length : 0,
          defaultPageId: getDefaultPageId(application.pages),
        }),
      );
      yield put({
        type: ReduxActionTypes.FETCH_APPLICATION_LIST_SUCCESS,
        payload: applicationListPayload,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_LIST_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createApplicationSaga(
  request: ReduxAction<CreateApplicationRequest>,
) {
  try {
    const response: CreateApplicationResponse = yield call(
      ApplicationApi.createApplication,
      request.payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const application: ApplicationPayload = {
        id: response.data.id,
        name: response.data.name,
        organizationId: response.data.organizationId,
        pageCount: response.data.pages ? response.data.pages.length : 0,
        defaultPageId: getDefaultPageId(response.data.pages),
      };
      yield put({
        type: ReduxActionTypes.CREATE_APPLICATION_SUCCESS,
        payload: application,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* applicationSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      publishApplicationSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_APPLICATION_LIST_INIT,
      fetchApplicationListSaga,
    ),
    takeLatest(ReduxActionTypes.CREATE_APPLICATION_INIT, createApplicationSaga),
  ]);
}
