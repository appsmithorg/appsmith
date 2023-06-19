import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
} from "utils/autoLayout/AutoLayoutUtils";
import { getWidgets, getWidgetsMeta } from "./selectors";
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
import { updateLayoutForMobileBreakpointAction } from "actions/autoLayoutActions";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import convertDSLtoAuto from "utils/DSLConversions/fixedToAutoLayout";
import { convertNormalizedDSLToFixed } from "utils/DSLConversions/autoToFixedLayout";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import { updateApplication } from "@appsmith/actions/applicationActions";
import { getIsCurrentlyConvertingLayout } from "selectors/autoLayoutSelectors";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";

function* shouldRunSaga(saga: any, action: ReduxAction<unknown>) {
  const isAutoLayout: boolean = yield select(getIsAutoLayout);
  if (isAutoLayout) {
    yield call(saga, action);
  }
}

export function* updateLayoutForMobileCheckpoint(
  actionPayload: ReduxAction<{
    parentId: string;
    isMobile: boolean;
    canvasWidth: number;
    widgets?: CanvasWidgetsReduxState;
  }>,
) {
  try {
    const start = performance.now();
    const isAutoLayout: boolean = yield select(getIsAutoLayout);
    if (!isAutoLayout) return;
    //Do not recalculate columns and update layout while converting layout
    const isCurrentlyConvertingLayout: boolean = yield select(
      getIsCurrentlyConvertingLayout,
    );
    if (isCurrentlyConvertingLayout) return;

    const {
      canvasWidth,
      isMobile,
      parentId,
      widgets: payloadWidgets,
    } = actionPayload.payload;

    let allWidgets: CanvasWidgetsReduxState;

    if (payloadWidgets) {
      allWidgets = payloadWidgets;
    } else {
      allWidgets = yield select(getWidgets);
    }

    const metaProps: Record<string, any> = yield select(getWidgetsMeta);
    const updatedWidgets: CanvasWidgetsReduxState = isMobile
      ? alterLayoutForMobile(
          allWidgets,
          parentId,
          canvasWidth,
          canvasWidth,
          false,
          metaProps,
        )
      : alterLayoutForDesktop(
          allWidgets,
          parentId,
          canvasWidth,
          false,
          metaProps,
        );
    yield put(updateAndSaveLayout(updatedWidgets));
    yield put(generateAutoHeightLayoutTreeAction(true, true));
    log.debug(
      "Auto-layout : updating layout for mobile viewport took",
      performance.now() - start,
      "ms",
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.RECALCULATE_COLUMNS,
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
export function* updateLayoutPositioningSaga(
  actionPayload: ReduxAction<AppPositioningTypes>,
) {
  try {
    const currPositioningType: AppPositioningTypes = yield select(
      getCurrentAppPositioningType,
    );
    const payloadPositioningType = actionPayload.payload;

    if (currPositioningType === payloadPositioningType) return;

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    //Convert fixed layout to auto-layout
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

      yield call(recalculateAutoLayoutColumnsAndSave);
    }
    // Convert auto-layout to fixed
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
        action: ReduxActionTypes.RECALCULATE_COLUMNS,
        error,
      },
    });
  }
}

//This Method is used to re calculate Positions based on canvas width
export function* recalculateAutoLayoutColumnsAndSave(
  widgets?: CanvasWidgetsReduxState,
) {
  const appPositioningType: AppPositioningTypes = yield select(
    getCurrentAppPositioningType,
  );
  const mainCanvasProps: MainCanvasReduxState = yield select(
    getMainCanvasProps,
  );

  yield put(
    updateLayoutForMobileBreakpointAction(
      MAIN_CONTAINER_WIDGET_ID,
      appPositioningType === AppPositioningTypes.AUTO
        ? mainCanvasProps?.isMobile
        : false,
      mainCanvasProps.width,
      widgets,
    ),
  );
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

function* updatePositionsOnTabChangeSaga(
  action: ReduxAction<{ selectedTabWidgetId: string; widgetId: string }>,
) {
  const { selectedTabWidgetId, widgetId } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  if (!selectedTabWidgetId || !allWidgets[selectedTabWidgetId]) return;
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);

  const updatedWidgets: CanvasWidgetsReduxState = updateWidgetPositions(
    allWidgets,
    selectedTabWidgetId,
    isMobile,
    mainCanvasWidth,
    false,
    {
      ...metaProps,
      [widgetId]: { ...metaProps[widgetId], selectedTabWidgetId },
    },
  );
  yield put(updateAndSaveLayout(updatedWidgets));
}

// TODO: BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY is already updating the height of tabs widget and the canvas. Why?
function* updatePositionsSaga(action: ReduxAction<{ widgetId: string }>) {
  const { widgetId } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  if (!widgetId || !allWidgets[widgetId]) return;
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);
  let canvasId: string = widgetId;
  if (allWidgets[canvasId].type === "TABS_WIDGET") {
    // For tabs widget, recalculate the height of child canvas.
    if (
      metaProps &&
      metaProps[canvasId] &&
      metaProps[canvasId]?.selectedTabWidgetId
    )
      canvasId = metaProps[canvasId]?.selectedTabWidgetId;
  }
  const updatedWidgets: CanvasWidgetsReduxState = updateWidgetPositions(
    allWidgets,
    canvasId,
    isMobile,
    mainCanvasWidth,
    false,
    metaProps,
  );
  yield put(updateAndSaveLayout(updatedWidgets));
}

export default function* layoutUpdateSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.RECALCULATE_COLUMNS,
      updateLayoutForMobileCheckpoint,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_LAYOUT_POSITIONING,
      updateLayoutPositioningSaga,
    ),
    // takeLatest(
    //   ReduxActionTypes.UPDATE_WIDGET_DIMENSIONS,
    //   updateWidgetDimensionsSaga,
    // ),
    // debounce(
    //   50,
    //   ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
    //   processAutoLayoutDimensionUpdatesSaga,
    // ),
    takeLatest(
      ReduxActionTypes.UPDATE_POSITIONS_ON_TAB_CHANGE,
      shouldRunSaga,
      updatePositionsOnTabChangeSaga,
    ),
    takeLatest(
      ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      shouldRunSaga,
      updatePositionsSaga,
    ),
  ]);
}
