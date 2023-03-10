import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "@appsmith/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { PageWidgetsReduxState } from "reducers/uiReducers/pageWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getPageWidgets } from "selectors/entitiesSelector";
import { convertNormalizedDSLToFixed } from "utils/DSLConversions/autoToFixedLayout";
import convertDSLtoAuto from "utils/DSLConversions/fixedToAutoLayout";
import { DSLWidget } from "widgets/constants";
import { createSnapshotSaga } from "./SnapshotSagas";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { saveAllPagesSaga } from "./PageSagas";
import { getCanvasWidth } from "selectors/editorSelectors";

function* convertFromAutoToFixedSaga(action: ReduxAction<SupportedLayouts>) {
  try {
    yield call(createSnapshotSaga);
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );
    const mainCanvasWidth: number = yield select(getCanvasWidth);
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    const pageLayouts = [];

    for (const [pageId, page] of Object.entries(pageWidgetsList)) {
      const { dsl: normalizedDSL, layoutId } = page;

      const fixedLayoutDSL = convertNormalizedDSLToFixed(
        normalizedDSL,
        action.payload,
        mainCanvasWidth,
      );

      const dsl: DSLWidget = CanvasWidgetsNormalizer.denormalize(
        MAIN_CONTAINER_WIDGET_ID,
        { canvasWidgets: fixedLayoutDSL },
      );

      pageLayouts.push({
        pageId,
        layoutId,
        layout: {
          dsl,
        },
      });
    }

    yield call(saveAllPagesSaga, pageLayouts);
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
  } catch (e) {
    log.error(e);
    yield put(
      setLayoutConversionStateAction(
        CONVERSION_STATES.COMPLETED_ERROR,
        e as Error,
      ),
    );
  }
}

function* convertFromFixedToAutoSaga() {
  try {
    yield call(createSnapshotSaga);
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    const pageLayouts = [];

    for (const [pageId, page] of Object.entries(pageWidgetsList)) {
      const { dsl: normalizedDSL, layoutId } = page;

      const fixedDSL: DSLWidget = CanvasWidgetsNormalizer.denormalize(
        MAIN_CONTAINER_WIDGET_ID,
        { canvasWidgets: normalizedDSL },
      );

      const dsl: DSLWidget = convertDSLtoAuto(fixedDSL);

      pageLayouts.push({
        pageId,
        layoutId,
        layout: {
          dsl,
        },
      });
    }

    yield call(saveAllPagesSaga, pageLayouts);
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
  } catch (e) {
    log.error(e);
    yield put(
      setLayoutConversionStateAction(
        CONVERSION_STATES.COMPLETED_ERROR,
        e as Error,
      ),
    );
  }
}

function* logLayoutConversionErrorSaga() {
  try {
    const error: Error = yield select(
      (state: AppState) => state.ui.layoutConversion.conversionError,
    );

    yield call(Sentry.captureException, error);
  } catch (e) {
    throw e;
  }
}

export default function* layoutConversionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CONVERT_AUTO_TO_FIXED,
      convertFromAutoToFixedSaga,
    ),
    takeLatest(
      ReduxActionTypes.CONVERT_FIXED_TO_AUTO,
      convertFromFixedToAutoSaga,
    ),
    takeLatest(
      ReduxActionTypes.LOG_LAYOUT_CONVERSION_ERROR,
      logLayoutConversionErrorSaga,
    ),
  ]);
}
