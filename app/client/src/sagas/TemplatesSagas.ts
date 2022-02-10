import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { all, put, takeEvery } from "redux-saga/effects";
import TemplatesMockResponse from "mockResponses/TemplateMockResponse.json";

function* getAllTemplatesSaga() {
  try {
    // const response = yield call(TemplatesAPI.getAllTemplates);
    // const isValid = yield validateResponse(response);

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

export default function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.GET_ALL_TEMPLATES_INIT, getAllTemplatesSaga),
  ]);
}
