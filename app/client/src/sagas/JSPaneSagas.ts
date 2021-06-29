import {
  all,
  select,
  put,
  takeEvery,
  takeLatest,
  call,
} from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getJSActions } from "selectors/entitiesSelector";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { JSAction } from "entities/JSAction";
import { createJSActionRequest } from "actions/jsActionActions";
import { JS_FUNCTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { parseUpdateJSAction } from "./EvaluationsSaga";

function* handleCreateNewJsActionSaga(action: ReduxAction<{ pageId: string }>) {
  // const organizationId = yield select(getCurrentOrgId);
  // const applicationId = yield select(getCurrentApplicationId);
  const { pageId } = action.payload;
  if (pageId) {
    const jsactions = yield select(getJSActions);
    const pageJSActions = jsactions.filter(
      (a: JSActionData) => a.config.pageId === pageId,
    );
    const newJSActionName = createNewJSFunctionName(pageJSActions, pageId);
    yield put(
      createJSActionRequest({
        name: newJSActionName,
        pageId,
      } as JSAction),
    );
  }
}

function* handleJSActionCreatedSaga(actionPayload: ReduxAction<JSAction>) {
  const { id } = actionPayload.payload;
  // const action = yield select(getJSAction, id);
  // const data = { ...action };
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(JS_FUNCTION_ID_URL(applicationId, pageId, id, {}));
}

function* handleParseUpdateJSAction(actionPayload: { body: string }) {
  const body = actionPayload.body;
  yield call(parseUpdateJSAction, body);
}

function* handleSaveJSAction(actionPayload: ReduxAction<{ body: string }>) {
  const { body } = actionPayload.payload;
  yield call(handleParseUpdateJSAction, { body: body });
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_NEW_JS_ACTION,
      handleCreateNewJsActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
      handleJSActionCreatedSaga,
    ),
    takeLatest(ReduxActionTypes.SAVE_JS_ACTION, handleSaveJSAction),
  ]);
}
