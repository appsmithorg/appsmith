import { all, select, takeLatest, put } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { AppState } from "../reducers";
import { bindingsMapSuccess } from "../actions/bindingActions";

function* createUpdateBindingsMapData() {
  const data: AppState = yield select();
  const map: Record<string, string> = {};
  data.entities.actions.data.forEach(action => {
    map[action.name] = `$.apiData.${action.id}`;
  });
  Object.keys(data.entities.canvasWidgets).forEach(widgetId => {
    const name = data.entities.canvasWidgets[widgetId].widgetName;
    map[name] = `$.canvasWidgets.${widgetId}`;
  });
  yield put(bindingsMapSuccess(map));
}

export default function* watchBindingsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_UPDATE_BINDINGS_MAP_INIT,
      createUpdateBindingsMapData,
    ),
  ]);
}
