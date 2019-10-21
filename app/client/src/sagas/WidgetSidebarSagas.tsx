import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "../constants/ReduxActionConstants";
import WidgetSidebarApi, {
  WidgetSidebarResponse,
} from "../api/WidgetSidebarApi";
import { successFetchingWidgetCards } from "../actions/widgetSidebarActions";
import { call, put, takeLatest, all } from "redux-saga/effects";

export function* fetchWidgetCards() {
  try {
    const widgetCards: WidgetSidebarResponse = yield all([
      call(WidgetSidebarApi.fetchWidgetCards),
    ]);
    yield put(successFetchingWidgetCards(widgetCards.cards));
  } catch (err) {
    yield put({ type: ReduxActionErrorTypes.FETCH_WIDGET_CARDS_ERROR, err });
  }
}

export function* fetchWidgetCardsSaga() {
  yield takeLatest(ReduxActionTypes.FETCH_WIDGET_CARDS, fetchWidgetCards);
}
