import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import ApplicationApi, {
  PublishApplicationResponse,
  PublishApplicationRequest,
  FetchApplicationsResponse,
  CreateApplicationRequest,
  CreateApplicationResponse,
  ApplicationResponsePayload,
  ApplicationPagePayload,
  SetDefaultPageRequest,
  DeleteApplicationRequest,
} from "api/ApplicationApi";
import { getDefaultPageId } from "./SagaUtils";
import { call, put, takeLatest, all, select } from "redux-saga/effects";

import { validateResponse } from "./ErrorSagas";
import { getApplicationList } from "selectors/applicationSelectors";
import { ApiResponse } from "api/ApiResponses";
import history from "utils/history";
import { BUILDER_PAGE_URL } from "constants/routes";

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

export function* fetchApplicationListSaga() {
  try {
    const response: FetchApplicationsResponse = yield call(
      ApplicationApi.fetchApplications,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const applicationListPayload: ApplicationPayload[] = response.data.map(
        (
          application: ApplicationResponsePayload & {
            pages: ApplicationPagePayload[];
          },
        ) => ({
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

export function* setDefaultApplicationPageSaga(
  action: ReduxAction<SetDefaultPageRequest>,
) {
  try {
    const request: SetDefaultPageRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.setDefaultApplicationPage,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS,
        payload: {
          pageId: request.pageId,
          applicationId: request.applicationId,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SET_DEFAULT_APPLICATION_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deleteApplicationSaga(
  action: ReduxAction<DeleteApplicationRequest>,
) {
  try {
    const request: DeleteApplicationRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.deleteApplication,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_APPLICATION_SUCCESS,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createApplicationSaga(
  action: ReduxAction<{
    applicationName: string;
    resolve: any;
    reject: any;
  }>,
) {
  try {
    const { applicationName, resolve, reject } = action.payload;
    const applicationList: ApplicationPayload[] = yield select(
      getApplicationList,
    );
    const existingApplication = applicationList.find(application => {
      return application.name === applicationName;
    });

    if (existingApplication) {
      yield call(reject, {
        _error: "An application with this name already exists",
      });
      yield put({
        type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
        payload: {
          error: "Could not create application",
          show: false,
        },
      });
    } else {
      const request: CreateApplicationRequest = { name: applicationName };
      const response: CreateApplicationResponse = yield call(
        ApplicationApi.createApplication,
        request,
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
        yield call(resolve);
        const pageURL = BUILDER_PAGE_URL(
          application.id,
          application.defaultPageId,
        );
        history.push(pageURL);
      } else {
        yield call(reject);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
      payload: {
        error,
        show: false,
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
    takeLatest(
      ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
      setDefaultApplicationPageSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_APPLICATION_INIT, deleteApplicationSaga),
  ]);
}
