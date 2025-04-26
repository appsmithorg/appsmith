import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  call,
  debounce,
  put,
  select,
  takeLatest,
} from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
  getCanvasDimensions,
} from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  getCanvasAndMetaWidgets,
  getWidgets,
  getWidgetsMeta,
} from "./selectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import {
  getCurrentApplicationId,
  getIsAutoLayout,
  getIsAutoLayoutMobileBreakPoint,
  getMainCanvasProps,
} from "selectors/editorSelectors";
import type { MainCanvasReduxState } from "ee/reducers/uiReducers/mainCanvasReducer";
import { updateLayoutForMobileBreakpointAction } from "actions/autoLayoutActions";
import convertDSLtoAuto from "layoutSystems/common/DSLConversions/fixedToAutoLayout";
import { convertNormalizedDSLToFixed } from "layoutSystems/common/DSLConversions/autoToFixedLayout";
import { updateWidgetPositions } from "layoutSystems/autolayout/utils/positionUtils";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import {
  getLeftColumn,
  getTopRow,
  getWidgetMinMaxDimensionsInPixel,
  setBottomRow,
  setRightColumn,
} from "layoutSystems/autolayout/utils/flexWidgetUtils";
import {
  updateMultipleMetaWidgetPropertiesAction,
  updateMultipleWidgetPropertiesAction,
} from "actions/controlActions";
import { isEmpty } from "lodash";
import { mutation_setPropertiesToUpdate } from "./autoHeightSagas/helpers";
import { updateApplication } from "ee/actions/applicationActions";
import { getIsCurrentlyConvertingLayout } from "selectors/autoLayoutSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import type { AppState } from "ee/reducers";
import { nestDSL, flattenDSL } from "@shared/dsl";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

// Saga check : if layout system is not anvil, then run the saga
// An alternative implementation would be to re-use shouldRunSaga,
// however we will still have to check for individula action types.
// This seems cleaner
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* preventForAnvil(saga: any, action: ReduxAction<unknown>) {
  const isAnvilLayout: boolean = yield select(getIsAnvilLayout);

  if (!isAnvilLayout) {
    yield call(shouldRunSaga, saga, action);
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export function* updateLayoutSystemTypeSaga(
  actionPayload: ReduxAction<LayoutSystemTypes>,
) {
  try {
    const currLayoutSystemType: LayoutSystemTypes =
      yield select(getLayoutSystemType);
    const payloadLayoutSystemType = actionPayload.payload;

    if (currLayoutSystemType === payloadLayoutSystemType) return;

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    //Convert fixed layout to auto-layout
    if (payloadLayoutSystemType === LayoutSystemTypes.AUTO) {
      const nestedDSL = nestDSL(allWidgets);

      const autoDSL = convertDSLtoAuto(nestedDSL);

      log.debug("autoDSL", autoDSL);

      const flattenedDSL = flattenDSL(autoDSL);

      yield put(updateAndSaveLayout(flattenedDSL));

      yield call(recalculateAutoLayoutColumnsAndSave);
    }
    // Convert auto-layout to fixed
    else {
      yield put(
        updateAndSaveLayout(convertNormalizedDSLToFixed(allWidgets, "DESKTOP")),
      );
    }

    yield call(updateApplicationLayoutType, payloadLayoutSystemType);
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
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  const mainCanvasProps: MainCanvasReduxState =
    yield select(getMainCanvasProps);

  yield put(
    updateLayoutForMobileBreakpointAction(
      MAIN_CONTAINER_WIDGET_ID,
      layoutSystemType === LayoutSystemTypes.AUTO
        ? mainCanvasProps?.isMobile
        : false,
      mainCanvasProps.width,
      widgets,
    ),
  );
}

let autoLayoutWidgetDimensionUpdateBatch: Record<
  string,
  { width: number; height: number }
> = {};

function batchWidgetDimensionsUpdateForAutoLayout(
  widgetId: string,
  width: number,
  height: number,
) {
  autoLayoutWidgetDimensionUpdateBatch[widgetId] = { width, height };
}

function* updateWidgetDimensionsSaga(
  action: ReduxAction<{ widgetId: string; width: number; height: number }>,
) {
  let { height, width } = action.payload;
  const { widgetId } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(
    getCanvasAndMetaWidgets,
  );
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

/**
 * This saga is responsible for updating the bounding box of the widget
 * when the widget component get resized internally.
 * It also updates the position of other affected widgets as well.
 */
function* processAutoLayoutDimensionUpdatesSaga() {
  if (Object.keys(autoLayoutWidgetDimensionUpdateBatch).length === 0) return;

  const allWidgets: CanvasWidgetsReduxState = yield select(
    getCanvasAndMetaWidgets,
  );
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  let widgets = allWidgets;
  const widgetsOld = { ...widgets };
  const parentIds = new Set<string>();

  // Iterate through the batch and update the new dimensions
  for (const widgetId in autoLayoutWidgetDimensionUpdateBatch) {
    const { height, width } = autoLayoutWidgetDimensionUpdateBatch[widgetId];
    const widget = allWidgets[widgetId];

    if (!widget) continue;

    const parentId = widget.parentId;

    if (parentId === undefined) continue;

    if (parentId) parentIds.add(parentId);

    const { columnSpace } = getCanvasDimensions(
      widgets[parentId],
      widgets,
      mainCanvasWidth,
      isMobile,
    );

    //get row space
    const rowSpace = widget.detachFromLayout
      ? 1
      : GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    let widgetToBeUpdated = { ...widget };

    widgetToBeUpdated = setBottomRow(
      widgetToBeUpdated,
      getTopRow(widget, isMobile) + height / rowSpace,
      isMobile,
    );

    widgetToBeUpdated = setRightColumn(
      widgetToBeUpdated,
      getLeftColumn(widget, isMobile) + width / columnSpace,
      isMobile,
    );

    widgets = {
      ...widgets,
      [widgetId]: widgetToBeUpdated,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);

  // Update the position of all the widgets
  for (const parentId of parentIds) {
    widgets = updateWidgetPositions(
      widgets,
      parentId,
      isMobile,
      mainCanvasWidth,
      false,
      metaProps,
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let widgetsToUpdate: any = {};

  /**
   * Iterate over all widgets and check if any of their dimensions have changed
   * If they have, add them to the list of widgets to update
   * Note: We need to iterate through all widgets since changing dimension of one widget might affect the dimensions of other widgets
   */
  for (const widgetId of Object.keys(widgets)) {
    const widget = widgets[widgetId];
    const oldWidget = widgetsOld[widgetId];
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propertiesToUpdate: Record<string, any> = {};

    const positionProperties = [
      "topRow",
      "bottomRow",
      "leftColumn",
      "rightColumn",
      "mobileTopRow",
      "mobileBottomRow",
      "mobileLeftColumn",
      "mobileRightColumn",
      "height",
    ];

    for (const prop of positionProperties) {
      if (widget[prop] !== oldWidget[prop]) {
        propertiesToUpdate[prop] = widget[prop];
      }
    }

    if (isEmpty(propertiesToUpdate)) continue;

    widgetsToUpdate = mutation_setPropertiesToUpdate(
      widgetsToUpdate,
      widgetId,
      propertiesToUpdate,
    );
  }

  const canvasWidgetsToUpdate: UpdateWidgetsPayload = {};
  const metaWidgetsToUpdate: UpdateWidgetsPayload = {};

  for (const widgetId in widgetsToUpdate) {
    const widget = widgets[widgetId];

    if (widget.isMetaWidget) {
      metaWidgetsToUpdate[widgetId] = widgetsToUpdate[widgetId];
    } else {
      canvasWidgetsToUpdate[widgetId] = widgetsToUpdate[widgetId];
    }
  }

  // Push all updates to the CanvasWidgetsReducer.
  // Note that we're not calling `UPDATE_LAYOUT`
  // as we don't need to trigger an eval
  if (!isEmpty(canvasWidgetsToUpdate)) {
    yield put(updateMultipleWidgetPropertiesAction(canvasWidgetsToUpdate));
  }

  if (!isEmpty(metaWidgetsToUpdate)) {
    yield put(updateMultipleMetaWidgetPropertiesAction(metaWidgetsToUpdate));
  }

  // clear the batch after processing
  autoLayoutWidgetDimensionUpdateBatch = {};
}

export function* updateApplicationLayoutType(
  layoutSystemType: LayoutSystemTypes,
) {
  const applicationId: string = yield select(getCurrentApplicationId);

  yield put(
    updateApplication(applicationId || "", {
      applicationDetail: {
        appPositioning: {
          type: layoutSystemType,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      preventForAnvil,
      updateLayoutForMobileCheckpoint,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_LAYOUT_SYSTEM_TYPE,
      preventForAnvil,
      updateLayoutSystemTypeSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_WIDGET_DIMENSIONS,
      preventForAnvil,
      updateWidgetDimensionsSaga,
    ),
    debounce(
      50,
      ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
      preventForAnvil,
      processAutoLayoutDimensionUpdatesSaga,
    ),
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
