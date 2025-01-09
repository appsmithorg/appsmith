import ApplicationApi, {
  type exportApplicationRequest,
} from "ee/api/ApplicationApi";
import type { ApplicationPayload } from "entities/Application";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getFlexLayersForSelectedWidgets } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select } from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { validateResponse } from "../ErrorSagas";
import { createWidgetCopy } from "../WidgetOperationUtils";
import { getWidgets } from "../selectors";
import { createMessage, ERROR_IN_EXPORTING_APP } from "ee/constants/messages";
import type { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

export interface PartialExportParams {
  jsObjects: string[];
  datasources: string[];
  customJSLibs: string[];
  widgets: string[];
  queries: string[];
}

export function* partialExportSaga(action: ReduxAction<PartialExportParams>) {
  try {
    const canvasWidgets: unknown = yield partialExportWidgetSaga(
      action.payload.widgets,
    );
    const applicationId: string = yield select(getCurrentApplicationId);
    const currentPageId: string = yield select(getCurrentPageId);

    const body: exportApplicationRequest = {
      actionList: action.payload.queries,
      actionCollectionList: action.payload.jsObjects,
      datasourceList: action.payload.datasources,
      customJsLib: action.payload.customJSLibs,
      widget: JSON.stringify(canvasWidgets),
    };

    const response: unknown = yield call(
      ApplicationApi.exportPartialApplication,
      applicationId,
      currentPageId,
      body,
    );
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      const application: ApplicationPayload = yield select(
        getCurrentApplication,
      );

      (function downloadJSON(response: unknown) {
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(response));
        const downloadAnchorNode = document.createElement("a");

        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${application.name}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      })((response as { data: unknown }).data);
      yield put({
        type: ReduxActionTypes.PARTIAL_EXPORT_SUCCESS,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.PARTIAL_EXPORT_ERROR,
      payload: {
        show: true,
        error: {
          message: createMessage(ERROR_IN_EXPORTING_APP),
        },
      },
    });
  }
}

export function* partialExportWidgetSaga(widgetIds: string[]) {
  const canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = yield select(getWidgets);
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  const selectedWidgets = widgetIds.map((each) => canvasWidgets[each]);

  if (!selectedWidgets || !selectedWidgets.length) return;

  const widgetListsToStore: {
    widgetId: string;
    parentId: string;
    list: FlattenedWidgetProps[];
  }[] = yield all(
    selectedWidgets.map((widget) => call(createWidgetCopy, widget)),
  );

  const canvasId = selectedWidgets?.[0]?.parentId || "";

  const flexLayers: FlexLayer[] = getFlexLayersForSelectedWidgets(
    widgetIds,
    canvasId ? canvasWidgets[canvasId] : undefined,
  );
  const widgetsDSL = {
    layoutSystemType, // We pass the layout system type, so that we can check if the widgets are compatible when importing
    widgets: widgetListsToStore,
    flexLayers,
  };

  return widgetsDSL;
}
