import { all, select, takeLatest, put, call, take } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { bindingsMapSuccess } from "actions/bindingActions";

function* createUpdateBindingsMapData() {
  const data: AppState = yield select();
  const map: Record<string, string> = {};
  data.entities.actions.data.forEach(action => {
    map[action.name] = `$.apiData.${action.id}.body`;
  });
  Object.keys(data.entities.canvasWidgets).forEach(widgetId => {
    const name = data.entities.canvasWidgets[widgetId].widgetName;
    map[name] = `$.canvasWidgets.${widgetId}`;
  });
  yield put(bindingsMapSuccess(map));
}

// The listener will keep track of any action
// that requires an update of the action and
// then call the update function again
function* initListener() {
  while (true) {
    // list all actions types here
    yield take([
      ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
      ReduxActionTypes.CREATE_ACTION_SUCCESS,
      ReduxActionTypes.UPDATE_ACTION_SUCCESS,
      ReduxActionTypes.DELETE_ACTION_SUCCESS,
      ReduxActionTypes.UPDATE_CANVAS,
      ReduxActionTypes.SAVE_PAGE_INIT,
    ]);
    yield call(createUpdateBindingsMapData);
  }
}

export default function* watchBindingsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_UPDATE_BINDINGS_MAP_LISTENER_INIT,
      initListener,
    ),
  ]);
}
