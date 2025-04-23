import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Page } from "entities/Page";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { AppState } from "ee/reducers";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import type { PageWidgetsReduxState } from "reducers/uiReducers/pageWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getPageWidgets } from "ee/selectors/entitiesSelector";
import { convertNormalizedDSLToFixed } from "layoutSystems/common/DSLConversions/autoToFixedLayout";
import convertToAutoLayout from "layoutSystems/common/DSLConversions/fixedToAutoLayout";
import type { DSLWidget } from "WidgetProvider/constants";
import {
  createSnapshotSaga,
  deleteApplicationSnapshotSaga,
} from "./SnapshotSagas";
import log from "loglevel";
import { saveAllPagesSaga } from "ee/sagas/PageSagas";
import { updateApplicationLayout } from "ee/actions/applicationActions";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import { updateApplicationLayoutType } from "./AutoLayoutUpdateSagas";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { nestDSL } from "@shared/dsl";
import { appsmithTelemetry } from "instrumentation";

/**
 * This method is used to convert from auto-layout to fixed layout
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
      appId,
    });
    snapshotSaveSuccess = true;

    //Set conversion form to indicated conversion loading state
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.CONVERSION_SPINNER),
    );

    const pageLayouts = [];

    //Convert all the pages into fixed layout by iterating over the list
    for (const page of pageList) {
      const pageId = page?.pageId;
      const { dsl: normalizedDSL, layoutId } = pageWidgetsList[pageId];

      const fixedLayoutDSL = convertNormalizedDSLToFixed(
        normalizedDSL,
        action.payload,
      );

      const dsl = nestDSL(fixedLayoutDSL);

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
    yield call(updateApplicationLayoutType, LayoutSystemTypes.FIXED);
    //update conversion form state to success
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    let error: Error = e;

    if (error) {
      error.message = `Layout conversion error - while converting from auto-layout to fixed layout: ${error.message}`;
    } else {
      error = new Error(
        "Layout conversion error - while converting from auto-layout to fixed layout",
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
 * This method is used to convert from fixed layout to auto-layout
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

      const fixedDSL = nestDSL(normalizedDSL);

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
    yield call(updateApplicationLayoutType, LayoutSystemTypes.AUTO);
    //update conversion form state to success
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    let error: Error = e;

    if (error) {
      error.message = `Layout conversion error - while converting from fixed layout to auto-layout: ${error.message}`;
    } else {
      error = new Error(
        "Layout conversion error - while converting from fixed layout to auto-layout",
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

    yield call(appsmithTelemetry.captureException, error, {
      errorName: "LayoutConversionError",
    });
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
