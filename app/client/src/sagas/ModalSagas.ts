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
import { WidgetAddChild } from "actions/pageActions";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetTypes,
} from "constants/WidgetConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";

import {
  getWidgets,
  getWidgetByName,
  getWidgetsMeta,
  getWidgetIdsByType,
  getWidgetMetaProps,
} from "sagas/selectors";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "actions/metaActions";
import { focusWidget } from "actions/widgetActions";
import log from "loglevel";
import { flatten } from "lodash";

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
      type: ReduxActionTypes.WIDGET_ADD_CHILD,
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
    type: ReduxActionTypes.SELECT_WIDGET,
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
              put(resetChildrenMetaProperty(widgetId)),
            ];
          }),
        ),
      );
    }
  } catch (error) {
    log.error(error);
  }
}

export default function* modalSagas() {
  yield all([
    takeEvery(ReduxActionTypes.CLOSE_MODAL, closeModalSaga),
    takeLatest(ReduxActionTypes.CREATE_MODAL_INIT, createModalSaga),
    takeLatest(ReduxActionTypes.SHOW_MODAL, showModalSaga),
    takeLatest(ReduxActionTypes.SHOW_MODAL_BY_NAME, showModalByNameSaga),
    takeLatest(ReduxActionTypes.WIDGET_CHILD_ADDED, showIfModalSaga),
  ]);
}
