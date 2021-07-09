import { takeLeading, all, put, select } from "redux-saga/effects";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import history from "../utils/history";
import { BUILDER_PAGE_URL } from "../constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "../selectors/editorSelectors";

export function* bindDataWithWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  // console.log("Binding Data in Saga");
  yield put({
    type: ReduxActionTypes.SHOW_PROPERTY_PANE,
    payload: {
      widgetId: action.payload.widgetId,
      callForDragOrResize: undefined,
      force: true,
    },
  });

  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  const queryId = searchParams.get("bindTo");
  console.log("Need to bind : ", { queryId });
  history.replace(BUILDER_PAGE_URL(applicationId, pageId, {}));
}

export default function* propertyPaneSagas() {
  yield all([
    takeLeading(ReduxActionTypes.BIND_DATA_WITH_WIDGET, bindDataWithWidgetSaga),
  ]);
}
