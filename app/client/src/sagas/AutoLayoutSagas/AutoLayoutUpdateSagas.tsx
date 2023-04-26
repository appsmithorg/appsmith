import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  call,
  debounce,
  put,
  select,
  takeLatest,
} from "redux-saga/effects";
import { getWidgets } from "../selectors";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  getCurrentApplicationId,
  getCurrentAppPositioningType,
  getIsAutoLayout,
  getIsAutoLayoutMobileBreakPoint,
  getMainCanvasProps,
} from "selectors/editorSelectors";
import type { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";
import { recalculatePositionsForCurrentBreakPointAction } from "actions/autoLayoutActions";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import convertDSLtoAuto from "utils/DSLConversions/fixedToAutoLayout";
import { convertNormalizedDSLToFixed } from "utils/DSLConversions/autoToFixedLayout";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import { getWidgetMinMaxDimensionsInPixel } from "utils/autoLayout/flexWidgetUtils";
import { updateApplication } from "@appsmith/actions/applicationActions";
import { getIsResizing } from "selectors/widgetSelectors";
import type { AppState } from "@appsmith/reducers";
import { isEmpty } from "lodash";
import { updateMultipleWidgetPropertiesAction } from "actions/controlActions";
import {
  batchWidgetDimensionsUpdateForAutoLayout,
  getWidgetsWithDimensionChanges,
  processWidgetDimensionsSaga,
  recalculatePositionsOfWidgets,
} from "./utils";

function* recalculatePositionsOfWidgetsSaga(payload: {
  parentId: string;
  isMobile: boolean;
  canvasWidth: number;
  widgets?: CanvasWidgetsReduxState;
  saveLayout?: boolean;
}) {
  try {
    const start = performance.now();
    const processedWidgets: CanvasWidgetsReduxState = yield call(
      recalculatePositionsOfWidgets,
      payload,
    );
    // save layout in cases like DnD where it creates new entities
    if (payload.saveLayout) {
      yield put(updateAndSaveLayout(processedWidgets));
    } else {
      const widgetsToUpdate: UpdateWidgetsPayload = yield call(
        getWidgetsWithDimensionChanges,
        processedWidgets,
      );

      // Push all updates to the CanvasWidgetsReducer.
      // Note that we're not calling `UPDATE_LAYOUT`
      // as we don't need to trigger an eval
      if (!isEmpty(widgetsToUpdate)) {
        yield put(updateMultipleWidgetPropertiesAction(widgetsToUpdate));
      }
    }

    log.debug(
      "Auto Layout : updating layout for mobile viewport took",
      performance.now() - start,
      "ms",
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.RECALCULATE_POSITIONS,
        error,
      },
    });
  }
}

/**
 * This Method is called when fixed and Auto are switched between each other using the Switch button on the right Pane
 * @param actionPayload
 * @returns
 */
function* updateLayoutPositioningSaga(
  actionPayload: ReduxAction<AppPositioningTypes>,
) {
  try {
    const currPositioningType: AppPositioningTypes = yield select(
      getCurrentAppPositioningType,
    );
    const payloadPositioningType = actionPayload.payload;

    if (currPositioningType === payloadPositioningType) return;

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    //Convert Fixed Layout to Auto
    if (payloadPositioningType === AppPositioningTypes.AUTO) {
      const denormalizedDSL = CanvasWidgetsNormalizer.denormalize(
        MAIN_CONTAINER_WIDGET_ID,
        { canvasWidgets: allWidgets },
      );

      const autoDSL = convertDSLtoAuto(denormalizedDSL);
      log.debug("autoDSL", autoDSL);

      yield put(
        updateAndSaveLayout(
          CanvasWidgetsNormalizer.normalize(autoDSL).entities.canvasWidgets,
        ),
      );
      yield put(recalculatePositionsForCurrentBreakPointAction());
    }
    // Convert Auto layout to fixed
    else {
      yield put(
        updateAndSaveLayout(convertNormalizedDSLToFixed(allWidgets, "DESKTOP")),
      );
    }

    yield call(updateApplicationLayoutType, payloadPositioningType);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.RECALCULATE_POSITIONS,
        error,
      },
    });
  }
}

//This Method is used to re calculate Positions based on canvas width
export function* recalculateAutoLayoutColumnsAndSave(
  actionPayload: ReduxAction<{
    widgets?: CanvasWidgetsReduxState;
    saveLayout?: boolean;
  }>,
) {
  const mainCanvasProps: MainCanvasReduxState = yield select(
    getMainCanvasProps,
  );
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const { saveLayout = false, widgets } = actionPayload.payload;
  yield call(recalculatePositionsOfWidgetsSaga, {
    parentId: MAIN_CONTAINER_WIDGET_ID,
    isMobile,
    canvasWidth: mainCanvasProps.width,
    widgets,
    saveLayout,
  });
}

export function* updateApplicationLayoutType(
  positioningType: AppPositioningTypes,
) {
  const applicationId: string = yield select(getCurrentApplicationId);
  yield put(
    updateApplication(applicationId || "", {
      applicationDetail: {
        appPositioning: {
          type: positioningType,
        },
      },
    }),
  );
}

function* updateAutoLayoutWidgetDimensionsSaga(
  action: ReduxAction<{ widgetId: string; width: number; height: number }>,
) {
  let { height, width } = action.payload;
  const { widgetId } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const isWidgetResizing: boolean = yield select(getIsResizing);
  const isCanvasResizing: boolean = yield select(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  const widget = allWidgets[widgetId];
  if (!widget) return;

  const widgetMinMaxDimensions = getWidgetMinMaxDimensionsInPixel(
    widget,
    mainCanvasWidth,
  );

  if (!isMobile && widget.widthInPercentage) {
    width = widget.widthInPercentage * mainCanvasWidth;
  }

  if (isMobile && widget.mobileWidthInPercentage) {
    width = widget.mobileWidthInPercentage * mainCanvasWidth;
  }

  if (
    widgetMinMaxDimensions.minHeight &&
    height < widgetMinMaxDimensions.minHeight
  ) {
    height = widgetMinMaxDimensions.minHeight;
  }
  if (
    widgetMinMaxDimensions.maxHeight &&
    height > widgetMinMaxDimensions.maxHeight
  ) {
    height = widgetMinMaxDimensions.maxHeight;
  }
  if (
    widgetMinMaxDimensions.minWidth &&
    width < widgetMinMaxDimensions.minWidth
  ) {
    width = widgetMinMaxDimensions.minWidth;
  }
  if (
    widgetMinMaxDimensions.maxWidth &&
    width > widgetMinMaxDimensions.maxWidth
  ) {
    width = widgetMinMaxDimensions.maxWidth;
  }

  batchWidgetDimensionsUpdateForAutoLayout(widgetId, width, height);

  if (!isWidgetResizing && !isCanvasResizing) {
    yield put({
      type: ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
    });
  }
}

function* processWidgetDimensionsAndPositions() {
  const processedWidgets: CanvasWidgetsReduxState = yield call(
    processWidgetDimensionsSaga,
  );
  yield put(recalculatePositionsForCurrentBreakPointAction(processedWidgets));
}
function* shouldRunSaga(saga: any, action: ReduxAction<unknown>) {
  const isAutoLayout: boolean = yield select(getIsAutoLayout);
  if (isAutoLayout) {
    yield call(saga, action);
  }
}

function* shouldRunCalculatingDimensionsSaga(
  saga: any,
  action: ReduxAction<unknown>,
) {
  const isAutoLayout: boolean = yield select(getIsAutoLayout);
  const isAutoCanvasResizing: boolean = yield select(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  if (isAutoLayout && !isAutoCanvasResizing) {
    yield call(saga, action);
  }
}

export default function* layoutUpdateSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.RECALCULATE_POSITIONS,
      shouldRunSaga,
      recalculateAutoLayoutColumnsAndSave,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_LAYOUT_POSITIONING,
      shouldRunSaga,
      updateLayoutPositioningSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_AUTO_LAYOUT_WIDGET_DIMENSIONS,
      shouldRunSaga,
      updateAutoLayoutWidgetDimensionsSaga,
    ),
    debounce(
      50,
      [
        ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
        ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
        ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE, // add, move, paste, cut, delete, undo/redo
      ],
      shouldRunCalculatingDimensionsSaga,
      processWidgetDimensionsAndPositions,
    ),
  ]);
}
