import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { all, delay, put, takeLeading } from "redux-saga/effects";

function* setMetaState(action: ReduxAction<MetaState>) {
  yield put({
    type: ReduxActionTypes.SET_META_STATE,
    payload: action.payload,
  });
  //This delay is combined with takeLeading to create a manual leading debounce
  yield delay(500);
}

export default function* MetaSagas() {
  yield all([
    takeLeading(
      [
        ReduxActionTypes.FETCH_PAGE_SUCCESS,
        ReduxActionTypes.SET_ALL_META_PROPS,
      ],
      setMetaState,
    ),
  ]);
}
