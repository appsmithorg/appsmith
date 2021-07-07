import {
  all,
  select,
  put,
  takeEvery,
  takeLatest,
  debounce,
  call,
} from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getJSAction, getJSActions } from "selectors/entitiesSelector";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { JSAction } from "entities/JSAction";
import { createJSActionRequest } from "actions/jsActionActions";
import { JS_FUNCTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { parseJSAction } from "./EvaluationsSaga";
import { getJSActionIdFromURL } from "../pages/Editor/Explorer/helpers";
import { getDifferenceInJSAction } from "../utils/JSPaneUtils";
import JSActionAPI from "../api/JSActionAPI";
import { GenericApiResponse } from "../api/ApiResponses";
import { updateJSActionSuccess } from "../actions/jsPaneActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getPluginIdOfPackageName } from "sagas/selectors";

export const JS_PLUGIN_PACKAGE_NAME = "js-plugin";

function* handleCreateNewJsActionSaga(action: ReduxAction<{ pageId: string }>) {
  const organizationId: string = yield select(getCurrentOrgId);
  const applicationId = yield select(getCurrentApplicationId);
  const { pageId } = action.payload;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    JS_PLUGIN_PACKAGE_NAME,
  );
  if (pageId && pluginId) {
    const jsactions = yield select(getJSActions);
    const pageJSActions = jsactions.filter(
      (a: JSActionData) => a.config.pageId === pageId,
    );
    const newJSActionName = createNewJSFunctionName(pageJSActions, pageId);
    yield put(
      createJSActionRequest({
        name: newJSActionName,
        pageId,
        organizationId,
        pluginId,
        body: "",
        variables: [],
        actions: [],
        applicationId,
      }),
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
  const parsedBody = yield call(parseJSAction, body);
  const jsActionId = getJSActionIdFromURL();
  if (jsActionId) {
    const jsAction: JSAction = yield select(getJSAction, jsActionId);
    const data = getDifferenceInJSAction(parsedBody, jsAction);
    data.body = body;
    return data;
  }
}

function* handleUpdateJSAction(actionPayload: ReduxAction<{ body: string }>) {
  const { body } = actionPayload.payload;
  const data = yield call(handleParseUpdateJSAction, { body: body });
  const response = yield JSActionAPI.updateJSAction(data);
  yield put(updateJSActionSuccess({ data: response }));
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
    debounce(
      1000,
      ReduxActionTypes.UPDATE_JS_ACTION_INIT,
      handleUpdateJSAction,
    ),
  ]);
}
