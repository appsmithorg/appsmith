import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery, call } from "redux-saga/effects";
import TemplatesAPI, { Template } from "api/TemplatesApi";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { getDefaultPageId } from "./ApplicationSagas";
import { setTemplateNotificationSeenAction } from "actions/templateActions";
import {
  getTemplateNotificationSeen,
  setTemplateNotificationSeen,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { ApiResponse } from "api/ApiResponses";

function* getAllTemplatesSaga() {
  try {
    const response: ApiResponse<Template> = yield call(
      TemplatesAPI.getAllTemplates,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_ALL_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* importTemplateToOrganisationSaga(
  action: ReduxAction<{ templateId: string; organizationId: string }>,
) {
  try {
    const response: Record<string, unknown> = yield call(
      TemplatesAPI.importTemplate,
      action.payload.templateId,
      action.payload.organizationId,
    );
    // @ts-expect-error: response.pages is of type unknown
    const application: ApplicationPayload = {
      ...response,
      // @ts-expect-error: response.pages is of type unknown
      defaultPageId: getDefaultPageId(response.pages),
    };
    const pageURL = BUILDER_PAGE_URL({
      applicationId: application.id,
      pageId: application.defaultPageId,
    });
    yield put({
      type: ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_SUCCESS,
      payload: response,
    });
    history.push(pageURL);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_ORGANISATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* getSimilarTemplatesSaga(action: ReduxAction<string>) {
  try {
    const response: ApiResponse<Template> = yield call(
      TemplatesAPI.getSimilarTemplates,
      action.payload,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_SIMILAR_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_SIMILAR_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* setTemplateNotificationSeenSaga(action: ReduxAction<boolean>) {
  yield setTemplateNotificationSeen(action.payload);
}

function* getTemplateNotificationSeenSaga() {
  const showTemplateNotification: unknown = yield getTemplateNotificationSeen();

  if (showTemplateNotification) {
    yield put(setTemplateNotificationSeenAction(true));
  } else {
    yield put(setTemplateNotificationSeenAction(false));
  }
}

export default function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.GET_ALL_TEMPLATES_INIT, getAllTemplatesSaga),
    takeEvery(
      ReduxActionTypes.GET_SIMILAR_TEMPLATES_INIT,
      getSimilarTemplatesSaga,
    ),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_INIT,
      importTemplateToOrganisationSaga,
    ),
    takeEvery(
      ReduxActionTypes.GET_TEMPLATE_NOTIFICATION_SEEN,
      getTemplateNotificationSeenSaga,
    ),
    takeEvery(
      ReduxActionTypes.SET_TEMPLATE_NOTIFICATION_SEEN,
      setTemplateNotificationSeenSaga,
    ),
  ]);
}
