import {
  all,
  select,
  call,
  put,
  takeLatest,
  takeEvery,
  delay,
} from "redux-saga/effects";

import { generateReactKey } from "utils/generators";
import {
  updateAndSaveLayout,
  WidgetAddChild,
  ModalWidgetResize,
} from "actions/pageActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxAction,
  WidgetReduxActionTypes,
} from "constants/ReduxActionConstants";

import {
  getWidget,
  getWidgets,
  getWidgetByName,
  getWidgetsMeta,
  getWidgetIdsByType,
  getWidgetMetaProps,
} from "sagas/selectors";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { updateWidgetMetaProperty } from "actions/metaActions";
import { focusWidget } from "actions/widgetActions";
import log from "loglevel";
import { flatten } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";

import WidgetFactory from "utils/WidgetFactory";
import { Toaster } from "components/ads/Toast";
import { deselectAllInitAction } from "actions/widgetSelectionActions";
const WidgetTypes = WidgetFactory.widgetTypes;

export function* createModalSaga(action: ReduxAction<{ modalName: string }>) {
  try {
    const modalWidgetId = generateReactKey();
    const props: WidgetAddChild = {
      widgetId: MAIN_CONTAINER_WIDGET_ID,
      widgetName: action.payload.modalName,
      type: WidgetTypes.MODAL_WIDGET,
      newWidgetId: modalWidgetId,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      leftColumn: 0,
      topRow: 0,
      columns: 0,
      rows: 0,
      tabId: "",
    };
    yield put({
      type: WidgetReduxActionTypes.WIDGET_ADD_CHILD,
      payload: props,
    });

    yield put({
      type: ReduxActionTypes.SHOW_MODAL,
      payload: { modalId: modalWidgetId },
    });
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
  const widgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const modal: FlattenedWidgetProps | undefined = Object.values(widgets).find(
    (widget: FlattenedWidgetProps) =>
      widget.widgetName === action.payload.modalName,
  );
  if (modal) {
    AppsmithConsole.info({
      text: action.payload.modalName
        ? `showModal('${action.payload.modalName}') was triggered`
        : `showModal() was triggered`,
    });

    yield put({
      type: ReduxActionTypes.SHOW_MODAL,
      payload: {
        modalId: modal.widgetId,
      },
    });
  }
}

export function* showIfModalSaga(
  action: ReduxAction<{ widgetId: string; type: string }>,
) {
  if (action.payload.type === "MODAL_WIDGET") {
    yield put({
      type: ReduxActionTypes.SHOW_MODAL,
      payload: { modalId: action.payload.widgetId },
    });
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

  yield put({
    type: ReduxActionTypes.SELECT_WIDGET_INIT,
    payload: { widgetId: action.payload.modalId },
  });
  yield put(focusWidget(action.payload.modalId));

  const metaProps = yield select(getWidgetMetaProps, action.payload.modalId);
  if (!metaProps || !metaProps.isVisible) {
    // Then show the modal we would like to show.
    yield put(
      updateWidgetMetaProperty(action.payload.modalId, "isVisible", true),
    );
    yield delay(1000);
  }
  yield put({
    type: ReduxActionTypes.SHOW_PROPERTY_PANE,
    payload: {
      widgetId: action.payload.modalId,
      callForDragOrResize: undefined,
      force: true,
    },
  });
}

export function* closeModalSaga(
  action: ReduxAction<{ modalName?: string; exclude?: string }>,
) {
  try {
    const { modalName } = action.payload;
    let widgetIds: string[] = [];
    // If modalName is provided, we just want to close this modal
    if (modalName) {
      const widget = yield select(getWidgetByName, modalName);
      widgetIds = [widget.widgetId];
      yield put({
        type: ReduxActionTypes.SHOW_PROPERTY_PANE,
        payload: {},
      });
    } else {
      // If modalName is not provided, find all open modals
      // Get all meta prop records
      const metaProps: Record<string, any> = yield select(getWidgetsMeta);

      // Get widgetIds of all widgets of type MODAL_WIDGET
      const modalWidgetIds: string[] = yield select(
        getWidgetIdsByType,
        WidgetTypes.MODAL_WIDGET,
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
              put(updateWidgetMetaProperty(widgetId, "isVisible", false)),
            ];
          }),
        ),
      );
    }
    if (modalName) {
      yield put(deselectAllInitAction());
      yield put(focusWidget(MAIN_CONTAINER_WIDGET_ID));
    }
  } catch (error) {
    log.error(error);
  }
}

export function* resizeModalSaga(resizeAction: ReduxAction<ModalWidgetResize>) {
  try {
    Toaster.clear();
    const start = performance.now();
    const { canvasWidgetId, height, widgetId, width } = resizeAction.payload;

    const stateWidget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const stateWidgets = yield select(getWidgets);

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
    yield put(updateAndSaveLayout(widgets));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_RESIZE,
        error,
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
