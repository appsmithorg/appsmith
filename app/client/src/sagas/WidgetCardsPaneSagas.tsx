// import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer"
import { ActionTypes, ReduxAction } from "../constants/ActionConstants"
import WidgetCardsPaneApi, { WidgetCardsPaneResponse, WidgetCardsPaneRequest } from "../api/WidgetCardsPaneApi"
import { successFetchingWidgetCards } from "../actions/widgetCardsPaneActions"
import { call, put, takeLatest } from "redux-saga/effects"


export function* fetchWidgetCards(widgetCardsRequestAction: ReduxAction<WidgetCardsPaneRequest>) {
  try {
    const widgetCards: WidgetCardsPaneResponse = yield call(WidgetCardsPaneApi.fetchWidgetCards)
    yield put(successFetchingWidgetCards(widgetCards.cards))
  } catch(err) {
    yield put({ type: ActionTypes.ERROR_FETCHING_WIDGET_CARDS, err})
  }
}

export function* fetchWidgetCardsSaga() {
  yield takeLatest(ActionTypes.FETCH_WIDGET_CARDS, fetchWidgetCards)
}