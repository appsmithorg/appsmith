import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery, delay, call } from "redux-saga/effects";
import TemplatesMockResponse from "mockResponses/TemplateMockResponse.json";
import TemplatesAPI from "api/TemplatesApi";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { getDefaultPageId } from "./ApplicationSagas";

function* getAllTemplatesSaga() {
  try {
    // const response = yield call(TemplatesAPI.getAllTemplates);
    // const isValid = yield validateResponse(response);
    yield delay(1000);
    if (true) {
      yield put({
        type: ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS,
        payload: TemplatesMockResponse.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS,
      payload: TemplatesMockResponse.data,
    });
    // yield put({
    //   type: ReduxActionErrorTypes.GET_ALL_TEMPLATES_ERROR,
    //   payload: TemplatesMockResponse.data,
    // });
  }
}

function* importTemplateToOrganisationSaga(
  action: ReduxAction<{ templateId: string; organizationId: string }>,
) {
  try {
    const response = yield call(
      TemplatesAPI.importTemplate,
      action.payload.templateId,
      action.payload.organizationId,
    );
    // const isValid = yield validateResponse(response);
    // console.log(isValid, "isValid");
    const application: ApplicationPayload = {
      ...response,
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
    // if (isValid) {
    //   const application: ApplicationPayload = {
    //     ...response.data,
    //     defaultPageId: getDefaultPageId(response.data.pages),
    //   };
    //   const pageURL = BUILDER_PAGE_URL({
    //     applicationId: application.id,
    //     pageId: application.defaultPageId,
    //   });
    //   yield put({
    //     type: ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_SUCCESS,
    //     payload: response.data,
    //   });
    //   history.push(pageURL);
    // }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_ORGANISATION_ERROR,
      payload: TemplatesMockResponse.data,
    });
  }
}

export default function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.GET_ALL_TEMPLATES_INIT, getAllTemplatesSaga),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_INIT,
      importTemplateToOrganisationSaga,
    ),
  ]);
}
