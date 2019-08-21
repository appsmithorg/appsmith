import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer"
import { ActionTypes, ReduxAction } from "../constants/ActionConstants"
import WidgetCardsPaneApi, { WidgetCardsPaneResponse, WidgetCardsPaneRequest } from "../api/WidgetCardsPaneApi"
import { call, put, takeLeading, all, takeEvery, takeLatest } from "redux-saga/effects"

export function* fetchWidgetCards(widgetCardsRequestAction: ReduxAction<WidgetCardsPaneRequest>) {
  try {
    const widgetCards: WidgetCardsPaneResponse = yield call(WidgetCardsPaneApi.fetchWidgetCards)
    yield put({ type: ActionTypes.SUCCESS_FETCHING_WIDGET_CARDS, widgetCards})
  } catch(err) {
    yield put({ type: ActionTypes.ERROR_FETCHING_WIDGET_CARDS, err})
  }
}

export function* fetchWidgetCardsSaga() {
  yield takeLatest(ActionTypes.FETCH_WIDGET_CARDS, fetchWidgetCards)
}