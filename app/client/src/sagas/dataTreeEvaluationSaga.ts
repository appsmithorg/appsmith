import {
  takeLatest,
  select,
  all,
  put,
  take,
  debounce,
} from "redux-saga/effects";
import { AppState } from "reducers";
import {
  getActionsForCurrentPage,
  getAppData,
} from "selectors/entitiesSelector";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import { getPageList } from "selectors/editorSelectors";
import { DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import _ from "lodash";

function* evaluateSaga() {
  console.log("Eval start");
  const actions = yield select(getActionsForCurrentPage);
  const widgets = yield select(getWidgets);
  const widgetsMeta = yield select(getWidgetsMeta);
  const pageList = yield select(getPageList);
  const appData = yield select(getAppData);
  const unEvalTree = DataTreeFactory.create(
    {
      actions,
      widgets,
      widgetsMeta,
      pageList,
      appData,
    },
    true,
  );
  const evalTree = yield getEvaluatedDataTree(unEvalTree);
  console.log({ evalTree });
  yield put({
    type: ReduxActionTypes.UPDATE_DATA_TREE,
    payload: evalTree,
  });
}

let oldState: AppState["entities"];
function* evaluationListener() {
  yield put({
    type: ReduxActionTypes.EVALUATE_DATA_TREE,
  });
  while (true) {
    yield take([
      ReduxActionTypes.SET_META_PROP,
      ReduxActionTypes.FETCH_PAGE_SUCCESS,
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
      ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
      ReduxActionTypes.UPDATE_LAYOUT,
      ReduxActionTypes.WIDGET_ADD_CHILD,
      ReduxActionTypes.WIDGET_DELETE,
      ReduxActionTypes.WIDGET_MOVE,
      ReduxActionTypes.EXECUTE_ACTION,
      ReduxActionTypes.EXECUTE_API_ACTION_REQUEST,
      ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS,
      ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
    ]);
    yield put({
      type: ReduxActionTypes.EVALUATE_DATA_TREE,
    });
    // const entities: AppState["entities"] = yield select(
    //   (state: AppState) => state.entities,
    // );
    // const changes = Object.keys(entities).map(
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    //   // @ts-ignore
    //   (key: keyof AppState["entities"]) => {
    //     if (key && oldState && key in oldState) {
    //       return { [key]: oldState[key] !== entities[key] };
    //     } else {
    //       return { [key]: true };
    //     }
    //   },
    // );
    // if (_.some(_.values(changes))) {
    //   if (entities !== oldState) {
    //     oldState = entities;
    //
    //     console.log({ changes });
    //   }
    // }
  }
}

export default function* evaluationTriggerSaga() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS, evaluationListener),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
      evaluationListener,
    ),
    takeLatest(ReduxActionTypes.EVALUATE_DATA_TREE, evaluateSaga),
  ]);
}
