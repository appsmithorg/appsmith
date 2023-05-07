import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
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
import {
  createSnapshotSaga,
  deleteApplicationSnapshotSaga,
} from "./SnapshotSagas";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { saveAllPagesSaga } from "./PageSagas";
import { updateApplicationLayout } from "@appsmith/actions/applicationActions";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import { updateApplicationLayoutType } from "./AutoLayoutUpdateSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";

/**
 * This method is used to convert from Auto layout to Fixed layout
 * @param action
 */
function* convertFromAutoToFixedSaga(action: ReduxAction<SupportedLayouts>) {
  let appId = "";
  let snapshotSaveSuccess = false;
  try {
    const pageList: Page[] = yield select(getPageList);
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    appId = yield select(getCurrentApplicationId);

    const notEmptyApp = isNotEmptyApp(pageWidgetsList);

    if (notEmptyApp) {
      yield call(createSnapshotSaga);
    }

    AnalyticsUtil.logEvent("CONVERT_AUTO_TO_FIXED", {
      isNewApp: !notEmptyApp,
    });
    snapshotSaveSuccess = true;

    //Set conversion form to indicated conversion loading state
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );

    const pageLayouts = [];

    //Convert all the pages into Fixed layout by iterating over the list
    for (const page of pageList) {
      const pageId = page?.pageId;
      const { dsl: normalizedDSL, layoutId } = pageWidgetsList[pageId];

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
  } catch (e: any) {
    let error: Error = e;
    if (error) {
      error.message = `Layout Conversion Error - while Converting from Auto to Fixed Layout: ${error.message}`;
    } else {
      error = new Error(
        "Layout Conversion Error - while Converting from Auto to Fixed Layout",
      );
    }

    log.error(error);

    if (snapshotSaveSuccess) {
      yield call(deleteApplicationSnapshotSaga);
    }
    //update conversion form state to error
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_ERROR, error),
    );

    AnalyticsUtil.logEvent("CONVERSION_FAILURE", {
      flow: "CONVERT_AUTO_TO_FIXED",
      appId,
    });
  }
}

/**
 * This method is used to convert from Fixed layout to Auto layout
 * @param action
 */
function* convertFromFixedToAutoSaga() {
  let appId = "";
  let snapshotSaveSuccess = false;
  try {
    const pageList: Page[] = yield select(getPageList);
    const pageWidgetsList: PageWidgetsReduxState = yield select(getPageWidgets);

    appId = yield select(getCurrentApplicationId);

    const notEmptyApp = isNotEmptyApp(pageWidgetsList);

    if (notEmptyApp) {
      yield call(createSnapshotSaga);
    }

    AnalyticsUtil.logEvent("CONVERT_FIXED_TO_AUTO", {
      isNewApp: !notEmptyApp,
      appId,
    });
    snapshotSaveSuccess = true;

    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );

    const pageLayouts = [];

    for (const page of pageList) {
      const pageId = page?.pageId;
      const { dsl: normalizedDSL, layoutId } = pageWidgetsList[pageId];

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
  } catch (e: any) {
    let error: Error = e;
    if (error) {
      error.message = `Layout Conversion Error - while Converting from Fixed to Auto Layout: ${error.message}`;
    } else {
      error = new Error(
        "Layout Conversion Error - while Converting from Fixed to Auto Layout",
      );
    }

    log.error(error);
    //update conversion form state to error
    if (snapshotSaveSuccess) {
      yield call(deleteApplicationSnapshotSaga);
    }
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_ERROR, error),
    );

    AnalyticsUtil.logEvent("CONVERSION_FAILURE", {
      flow: "CONVERT_FIXED_TO_AUTO",
      appId,
    });
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
function isNotEmptyApp(pageWidgetsList: PageWidgetsReduxState) {
  const pageList = Object.values(pageWidgetsList);

  if (pageList.length !== 1) return true;

  const { dsl: pageDSL } = pageList[0];

  return Object.keys(pageDSL).length !== 1;
}
