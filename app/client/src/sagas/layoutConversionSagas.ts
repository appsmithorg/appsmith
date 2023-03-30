import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import type { PageWidgetsReduxState } from "reducers/uiReducers/pageWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getPageWidgets } from "selectors/entitiesSelector";
import { convertNormalizedDSLToFixed } from "utils/DSLConversions/autoToFixedLayout";
import convertToAutoLayout from "utils/DSLConversions/fixedToAutoLayout";
import type { DSLWidget } from "widgets/constants";
import { createSnapshotSaga } from "./SnapshotSagas";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { saveAllPagesSaga } from "./PageSagas";
import { updateApplicationLayout } from "@appsmith/actions/applicationActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplicationLayoutType } from "./AutoLayoutUpdateSagas";

/**
 * This method is used to convert from Auto layout to Fixed layout
 * @param action
 */
function* convertFromAutoToFixedSaga(action: ReduxAction<SupportedLayouts>) {
  try {
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    if (getShouldSaveSnapShot(pageWidgetsList)) {
      yield call(createSnapshotSaga);
    }

    //Set conversion form to indicated conversion loading state
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );

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
    yield call(updateApplicationLayoutType, AppPositioningTypes.FIXED);
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
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    if (getShouldSaveSnapShot(pageWidgetsList)) {
      yield call(createSnapshotSaga);
    }

    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );

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
    yield call(updateApplicationLayoutType, AppPositioningTypes.AUTO);
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

//Function returns boolean, SnapShot should not be saved for a single empty canvas
function getShouldSaveSnapShot(pageWidgetsList: PageWidgetsReduxState) {
  const pageList = Object.values(pageWidgetsList);

  if (pageList.length !== 1) return true;

  const { dsl: pageDSL } = pageList[0];

  return Object.keys(pageDSL).length !== 1;
}
