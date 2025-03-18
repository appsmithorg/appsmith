import {
  all,
  call,
  delay,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";

import { generateReactKey } from "utils/generators";
import type { ModalWidgetResize, WidgetAddChild } from "actions/pageActions";
import { updateAndSaveLayout } from "actions/pageActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";

import {
  getWidget,
  getWidgetByName,
  getWidgetIdsByType,
  getWidgetMetaProps,
  getWidgets,
  getWidgetsMeta,
} from "sagas/selectors";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { updateWidgetMetaPropAndEval } from "actions/metaActions";
import {
  closePropertyPane,
  focusWidget,
  showModal,
} from "actions/widgetActions";
import log from "loglevel";
import { flatten } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "./WidgetSelectUtils";
import { toast } from "@appsmith/ads";
import { getIsAutoLayout } from "selectors/editorSelectors";
import { recalculateAutoLayoutColumnsAndSave } from "./AutoLayoutUpdateSagas";
import {
  FlexLayerAlignment,
  LayoutDirection,
} from "layoutSystems/common/utils/constants";
import { getModalWidgetType } from "selectors/widgetSelectors";
import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { getWidgetSelectionBlock } from "selectors/ui";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { showPropertyPane } from "../actions/propertyPaneActions";

const WidgetTypes = WidgetFactory.widgetTypes;

export function* createModalSaga(action: ReduxAction<{ modalName: string }>) {
  try {
    const modalWidgetId = generateReactKey();
    const isAutoLayout: boolean = yield select(getIsAutoLayout);
    const modalWidgetType: string = yield select(getModalWidgetType);
    const isAnvilLayout: boolean = yield select(getIsAnvilLayout);
    const newWidget: WidgetAddChild = {
      widgetId: MAIN_CONTAINER_WIDGET_ID,
      widgetName: action.payload.modalName,
      type: modalWidgetType,
      newWidgetId: modalWidgetId,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      leftColumn: 0,
      topRow: 0,
      columns: 0,
      rows: 0,
      tabId: "",
    };

    if (isAutoLayout) {
      const dropPayload = {
        alignment: FlexLayerAlignment.Center,
        index: 0,
        isNewLayer: true,
        layerIndex: 0,
        rowIndex: 0,
      };

      newWidget.props = {
        alignment: FlexLayerAlignment.Center,
      };

      yield put({
        type: ReduxActionTypes.AUTOLAYOUT_ADD_NEW_WIDGETS,
        payload: {
          dropPayload,
          newWidget,
          parentId: MAIN_CONTAINER_WIDGET_ID,
          direction: LayoutDirection.Vertical,
          addToBottom: true,
        },
      });
    } else if (isAnvilLayout) {
      //TODO(#30604): Refactor to separate this logic from the anvil layout system
      yield put({
        type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        payload: {
          highlight: { alignment: "none", canvasId: "0" },
          newWidget: { ...newWidget, detachFromLayout: true },
          dragMeta: {
            draggedWidgetTypes: "WIDGETS",
            draggedOn: "MAIN_CANVAS",
          },
        },
      });
    } else {
      yield put({
        type: WidgetReduxActionTypes.WIDGET_ADD_CHILD,
        payload: newWidget,
      });
    }
  } catch (error) {
    log.error(error);
    yield put({
      type: ReduxActionErrorTypes.CREATE_MODAL_ERROR,
      payload: { error },
    });
  }
}

export function* showModalByNameSaga(
  action: ReduxAction<{ modalName: string }>,
) {
  const modal: FlattenedWidgetProps | null = yield select(
    getWidgetByName,
    action.payload.modalName,
  );

  if (modal) {
    yield put(showModal(modal.widgetId));
  }
}

export function* showIfModalSaga(
  action: ReduxAction<{ widgetId: string; type: string }>,
) {
  if (action.payload.type === "MODAL_WIDGET") {
    yield put(showModal(action.payload.widgetId));
  }
}

export function* showModalSaga(action: ReduxAction<{ modalId: string }>) {
  // First we close the currently open modals (if any)
  // Notice the empty payload.
  yield call(closeModalSaga, {
    type: ReduxActionTypes.CLOSE_MODAL,
    payload: {
      exclude: action.payload.modalId,
    },
  });

  yield put(focusWidget(action.payload.modalId));

  const widgetLikeProps = {
    widgetId: action.payload.modalId,
  } as WidgetProps;
  const metaProps: Record<string, unknown> = yield select(
    getWidgetMetaProps,
    widgetLikeProps,
  );

  if (!metaProps || !metaProps.isVisible) {
    // Then show the modal we would like to show.
    yield put(
      updateWidgetMetaPropAndEval(action.payload.modalId, "isVisible", true),
    );
    yield delay(1000);
  }

  yield put(
    showPropertyPane({
      widgetId: action.payload.modalId,
      callForDragOrResize: undefined,
      force: true,
    }),
  );
}

export function* closeModalSaga(
  action: ReduxAction<{ modalName?: string; exclude?: string }>,
) {
  try {
    const { modalName } = action.payload;

    let widgetIds: string[] = [];

    // If modalName is provided, we just want to close this modal
    if (modalName) {
      const widget: FlattenedWidgetProps | null = yield select(
        getWidgetByName,
        modalName,
      );

      widgetIds = widget ? [widget.widgetId] : [];
      yield put(closePropertyPane());
    } else {
      // If modalName is not provided, find all open modals
      // Get all meta prop records
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metaProps: Record<string, any> = yield select(getWidgetsMeta);
      const modalWidgetType: string = yield select(getModalWidgetType);

      // Get widgetIds of all widgets of type MODAL_WIDGET
      // Note: Not updating this code path for WDS_MODAL_WIDGET, as the functionality
      // may require us to keep existing modals open.
      // In this, the flow of switching back and forth between multiple modals is to be tested.
      const modalWidgetIds: string[] = yield select(
        getWidgetIdsByType,
        modalWidgetType,
      );

      // Loop through all modal widgetIds
      modalWidgetIds.forEach((widgetId: string) => {
        // Check if modal is open
        if (metaProps[widgetId] && metaProps[widgetId].isVisible) {
          // Add to our list of widgetIds
          widgetIds.push(widgetId);
        }
      });
    }

    widgetIds = action.payload.exclude
      ? widgetIds.filter((id: string) => id !== action.payload.exclude)
      : widgetIds;

    // If we have modals to close, set its isVisible to false to close.
    if (widgetIds) {
      yield all(
        flatten(
          widgetIds.map((widgetId: string) => {
            return [
              put(updateWidgetMetaPropAndEval(widgetId, "isVisible", false)),
            ];
          }),
        ),
      );
    }

    if (modalName) {
      const isWidgetSelectionBlocked: boolean = yield select(
        getWidgetSelectionBlock,
      );

      if (!isWidgetSelectionBlocked) {
        yield put(selectWidgetInitAction(SelectionRequestType.Empty));
        yield put(focusWidget(MAIN_CONTAINER_WIDGET_ID));
      }
    }
  } catch (error) {
    log.error(error);
  }
}

export function* resizeModalSaga(resizeAction: ReduxAction<ModalWidgetResize>) {
  try {
    toast.dismiss();
    const start = performance.now();
    const { canvasWidgetId, height, widgetId, width } = resizeAction.payload;

    const stateWidget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const isAutoLayout: boolean = yield select(getIsAutoLayout);

    let widget = { ...stateWidget };
    const widgets = { ...stateWidgets };

    widget = { ...widget, height, width };
    widgets[widgetId] = widget;

    if (canvasWidgetId) {
      const bottomRow = getModalCanvasBottomRow(
        widgets,
        canvasWidgetId,
        height,
      );
      const stateModalContainerWidget: FlattenedWidgetProps = yield select(
        getWidget,
        canvasWidgetId,
      );
      let modalContainerWidget = { ...stateModalContainerWidget };

      modalContainerWidget = {
        ...modalContainerWidget,
        bottomRow,
        minHeight: height,
      };

      widgets[canvasWidgetId] = modalContainerWidget;
    }

    log.debug("resize computations took", performance.now() - start, "ms");

    //TODO Identify the updated widgets and pass the values
    if (isAutoLayout) {
      yield call(recalculateAutoLayoutColumnsAndSave, widgets);
      yield put({
        type: ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
      });
    } else {
      yield put(updateAndSaveLayout(widgets));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_RESIZE,
        error,
        logToDebugger: true,
      },
    });
  }
}

/**
 * Note: returns bottomRow of the lowest widget on the canvas
 * @param finalWidgets
 * @param parentId
 * @param height
 */
const getModalCanvasBottomRow = (
  finalWidgets: CanvasWidgetsReduxState,
  parentId: string,
  height: number,
): number => {
  if (
    !finalWidgets[parentId] ||
    finalWidgets[parentId].type !== WidgetTypes.CANVAS_WIDGET
  ) {
    return height;
  }

  const lowestBottomRowHeight =
    height -
    GridDefaults.CANVAS_EXTENSION_OFFSET *
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT -
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

  let lowestBottomRow = Math.ceil(
    lowestBottomRowHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
  const childIds = finalWidgets[parentId].children || [];

  // find lowest row
  childIds.forEach((cId: string) => {
    const child = finalWidgets[cId];

    if (child.bottomRow > lowestBottomRow) {
      lowestBottomRow = child.bottomRow;
    }
  });

  return (
    (lowestBottomRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT
  );
};

export default function* modalSagas() {
  yield all([
    takeEvery(ReduxActionTypes.CLOSE_MODAL, closeModalSaga),
    takeLatest(ReduxActionTypes.CREATE_MODAL_INIT, createModalSaga),
    takeLatest(ReduxActionTypes.SHOW_MODAL, showModalSaga),
    takeLatest(ReduxActionTypes.SHOW_MODAL_BY_NAME, showModalByNameSaga),
    takeLatest(WidgetReduxActionTypes.WIDGET_CHILD_ADDED, showIfModalSaga),
    takeLatest(WidgetReduxActionTypes.WIDGET_MODAL_RESIZE, resizeModalSaga),
  ]);
}
