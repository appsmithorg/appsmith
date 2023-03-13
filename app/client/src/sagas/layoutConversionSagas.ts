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
import convertToAutoLayout from "utils/DSLConversions/fixedToAutoLayout";
import { DSLWidget } from "widgets/constants";
import { createSnapshotSaga } from "./SnapshotSagas";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { saveAllPagesSaga } from "./PageSagas";
import { updateApplicationLayout } from "actions/applicationActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";

/**
 * This method is used to convert from Auto layout to Fixed layout
 * @param action
 */
function* convertFromAutoToFixedSaga(action: ReduxAction<SupportedLayouts>) {
  try {
    yield call(createSnapshotSaga);
    //Set conversion form to indicated conversion loading state
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    const pageLayouts = [];

    //Convert all the pages into Fixed layout by iterating over the list
    for (const [pageId, page] of Object.entries(pageWidgetsList)) {
      const { dsl: normalizedDSL, layoutId } = page;

      const fixedLayoutDSL = convertNormalizedDSLToFixed(
        normalizedDSL,
        action.payload,
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
    //Set type of fixed layout
    yield call(setLayoutTypePostConversion, action.payload);
    //update conversion form state to success
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
  } catch (e) {
    log.error(e);
    //update conversion form state to error
    yield put(
      setLayoutConversionStateAction(
        CONVERSION_STATES.COMPLETED_ERROR,
        e as Error,
      ),
    );
  }
}

/**
 * This method is used to convert from Fixed layout to Auto layout
 * @param action
 */
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

      const dsl: DSLWidget = convertToAutoLayout(fixedDSL);

      pageLayouts.push({
        pageId,
        layoutId,
        layout: {
          dsl,
        },
      });
    }

    yield call(saveAllPagesSaga, pageLayouts);
    //update conversion form state to success
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
  } catch (e) {
    log.error(e);
    //update conversion form state to error
    yield put(
      setLayoutConversionStateAction(
        CONVERSION_STATES.COMPLETED_ERROR,
        e as Error,
      ),
    );
  }
}

//Saga to log conversion sentry error when user reports it
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

/**
 * Set layout type of Application based on user selection while converting
 * @param selectedLayoutType
 */
function* setLayoutTypePostConversion(selectedLayoutType: SupportedLayouts) {
  let convertToLayoutType: SupportedLayouts = selectedLayoutType;
  const applicationId: string = yield select(getCurrentApplicationId);

  if (selectedLayoutType === "DESKTOP") {
    convertToLayoutType = "FLUID";
  }

  yield put(
    updateApplicationLayout(applicationId, {
      appLayout: {
        type: convertToLayoutType,
      },
    }),
  );
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
