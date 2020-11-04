import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import ApplicationApi, {
  ApplicationObject,
  ApplicationPagePayload,
  ApplicationResponsePayload,
  ChangeAppViewAccessRequest,
  CreateApplicationRequest,
  CreateApplicationResponse,
  DeleteApplicationRequest,
  DuplicateApplicationRequest,
  FetchApplicationsResponse,
  FetchUsersApplicationsOrgsResponse,
  OrganizationApplicationObject,
  PublishApplicationRequest,
  PublishApplicationResponse,
  SetDefaultPageRequest,
  UpdateApplicationRequest,
} from "api/ApplicationApi";
import { getDefaultPageId } from "./SagaUtils";
import { all, call, put, select, takeLatest } from "redux-saga/effects";

import { validateResponse } from "./ErrorSagas";
import { getUserApplicationsOrgsList } from "selectors/applicationSelectors";
import { ApiResponse } from "api/ApiResponses";
import history from "utils/history";
import { BUILDER_PAGE_URL } from "constants/routes";
import { AppState } from "reducers";
import {
  FetchApplicationPayload,
  setDefaultApplicationPageSuccess,
} from "actions/applicationActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { AppToaster } from "components/editorComponents/ToastComponent";
import {
  DELETING_APPLICATION,
  DUPLICATING_APPLICATION,
} from "constants/messages";
import { APP_MODE } from "../reducers/entityReducers/appReducer";
import { Organization } from "constants/orgConstants";

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
export function* getAllApplicationSaga() {
  try {
    const response: FetchUsersApplicationsOrgsResponse = yield call(
      ApplicationApi.getAllApplication,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const organizationApplication: OrganizationApplicationObject[] = response.data.organizationApplications.map(
        (userOrgs: OrganizationApplicationObject) => ({
          organization: userOrgs.organization,
          applications: !userOrgs.applications
            ? []
            : userOrgs.applications.map((application: ApplicationObject) => {
                return {
                  ...application,
                  pageCount: application.pages ? application.pages.length : 0,
                  defaultPageId: getDefaultPageId(application.pages),
                };
              }),
        }),
      );

      yield put({
        type: ReduxActionTypes.FETCH_USER_APPLICATIONS_ORGS_SUCCESS,
        payload: organizationApplication,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_APPLICATIONS_ORGS_ERROR,
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
          ...application,
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

export function* fetchApplicationSaga(
  action: ReduxAction<FetchApplicationPayload>,
) {
  try {
    const { mode, applicationId } = action.payload;
    // Get endpoint based on app mode
    const apiEndpoint =
      mode === APP_MODE.EDIT
        ? ApplicationApi.fetchApplication
        : ApplicationApi.fetchApplicationForViewMode;

    const response: FetchApplicationsResponse = yield call(
      apiEndpoint,
      applicationId,
    );

    yield put({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
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
    const defaultPageId = yield select(
      (state: AppState) => state.entities.pageList.defaultPageId,
    );
    if (defaultPageId !== action.payload.id) {
      const request: SetDefaultPageRequest = action.payload;
      const response: ApiResponse = yield call(
        ApplicationApi.setDefaultApplicationPage,
        request,
      );
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        yield put(
          setDefaultApplicationPageSuccess(request.id, request.applicationId),
        );
      }
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

export function* updateApplicationSaga(
  action: ReduxAction<UpdateApplicationRequest>,
) {
  try {
    const request: UpdateApplicationRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.updateApplication,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
        payload: response.data,
      });
      AppToaster.show({
        message: `Application updated`,
        type: "success",
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
    AppToaster.show({
      message: error,
      type: "error",
    });
  }
}

export function* deleteApplicationSaga(
  action: ReduxAction<DeleteApplicationRequest>,
) {
  try {
    AppToaster.show({ message: DELETING_APPLICATION });
    const request: DeleteApplicationRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.deleteApplication,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_APPLICATION_SUCCESS,
        payload: response.data,
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

export function* duplicateApplicationSaga(
  action: ReduxAction<DeleteApplicationRequest>,
) {
  try {
    AppToaster.show({ message: DUPLICATING_APPLICATION });
    const request: DuplicateApplicationRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.duplicateApplication,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const application: ApplicationPayload = {
        ...response.data,
        pageCount: response.data.pages ? response.data.pages.length : 0,
        defaultPageId: getDefaultPageId(response.data.pages),
      };
      yield put({
        type: ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS,
        payload: response.data,
      });
      const pageURL = BUILDER_PAGE_URL(
        application.id,
        application.defaultPageId,
      );
      history.push(pageURL);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DUPLICATE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* changeAppViewAccessSaga(
  requestAction: ReduxAction<ChangeAppViewAccessRequest>,
) {
  try {
    const request = requestAction.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.changeAppViewAccess,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CHANGE_APPVIEW_ACCESS_SUCCESS,
        payload: {
          id: response.data.id,
          isPublic: response.data.isPublic,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_APPVIEW_ACCESS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createApplicationSaga(
  action: ReduxAction<{
    applicationName: string;
    orgId: string;
    resolve: any;
    reject: any;
  }>,
) {
  const { applicationName, orgId, reject } = action.payload;
  try {
    const userOrgs = yield select(getUserApplicationsOrgsList);
    const existingOrgs = userOrgs.filter(
      (org: Organization) => org.organization.id === orgId,
    )[0];
    const existingApplication = existingOrgs
      ? existingOrgs.applications.find(
          (application: ApplicationPayload) =>
            application.name === applicationName,
        )
      : null;
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
      const request: CreateApplicationRequest = {
        name: applicationName,
        orgId,
      };
      const response: CreateApplicationResponse = yield call(
        ApplicationApi.createApplication,
        request,
      );
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        const application: ApplicationPayload = {
          ...response.data,
          pageCount: response.data.pages ? response.data.pages.length : 0,
          defaultPageId: getDefaultPageId(response.data.pages),
        };
        AnalyticsUtil.logEvent("CREATE_APP", {
          appName: application.name,
        });
        yield put({
          type: ReduxActionTypes.CREATE_APPLICATION_SUCCESS,
          payload: {
            orgId,
            application,
          },
        });
        const pageURL = BUILDER_PAGE_URL(
          application.id,
          application.defaultPageId,
        );
        history.push(pageURL);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
      payload: {
        error,
        show: false,
        orgId,
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
    takeLatest(ReduxActionTypes.UPDATE_APPLICATION, updateApplicationSaga),
    takeLatest(
      ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT,
      changeAppViewAccessSaga,
    ),
    takeLatest(
      ReduxActionTypes.GET_ALL_APPLICATION_INIT,
      getAllApplicationSaga,
    ),
    takeLatest(ReduxActionTypes.FETCH_APPLICATION_INIT, fetchApplicationSaga),
    takeLatest(ReduxActionTypes.CREATE_APPLICATION_INIT, createApplicationSaga),
    takeLatest(
      ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
      setDefaultApplicationPageSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_APPLICATION_INIT, deleteApplicationSaga),
    takeLatest(
      ReduxActionTypes.DUPLICATE_APPLICATION_INIT,
      duplicateApplicationSaga,
    ),
  ]);
}
