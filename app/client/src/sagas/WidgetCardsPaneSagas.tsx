// import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer"
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import WidgetCardsPaneApi, {
  WidgetCardsPaneResponse,
} from "../api/WidgetCardsPaneApi";
import { successFetchingWidgetCards } from "../actions/widgetCardsPaneActions";
import { call, put, takeLatest, all } from "redux-saga/effects";

export function* fetchWidgetCards() {
  try {
    const widgetCards: WidgetCardsPaneResponse = yield all([
      call(WidgetCardsPaneApi.fetchWidgetCards),
    ]);
    yield put(successFetchingWidgetCards(widgetCards.cards));
  } catch (err) {
    yield put({ type: ReduxActionTypes.ERROR_FETCHING_WIDGET_CARDS, err });
  }
}

export function* fetchWidgetCardsSaga() {
  yield takeLatest(ReduxActionTypes.FETCH_WIDGET_CARDS, fetchWidgetCards);
}
