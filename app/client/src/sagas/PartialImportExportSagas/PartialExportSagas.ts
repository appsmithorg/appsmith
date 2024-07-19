import ApplicationApi, {
  type exportApplicationRequest,
} from "@appsmith/api/ApplicationApi";
import type {
  ApplicationPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  createMessage,
  ERROR_IN_EXPORTING_APP,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { toast } from "design-system";
import { getFlexLayersForSelectedWidgets } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import type { LayoutSystemTypes } from "layoutSystems/types";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select } from "redux-saga/effects";
import {
  getBoundaryWidgetsFromCopiedWidgets,
  getRelatedEntitiesForWidgets,
} from "sagas/BuildingBlockSagas/QuickerBuildingBlocks.utils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { validateResponse } from "../ErrorSagas";
import { createWidgetCopy } from "../WidgetOperationUtils";
import { getWidgets } from "../selectors";
import { openCreateBuildingBlockModal } from "actions/buildingBlockActions";

export interface PartialExportParams {
  jsObjects: string[];
  datasources: string[];
  customJSLibs: string[];
  widgets: string[];
  queries: string[];
}

export function* createCustomBBSaga(
  action: ReduxAction<{
    buildingBlockName: string;
    buildingBlockIconURL: string;
    widgets: string[];
  }>,
) {
  try {
    const canvasWidgets: unknown = yield partialExportWidgetSaga(
      action.payload.widgets,
    );
    const body: any = {
      widget: canvasWidgets,
      name: action.payload.buildingBlockName,
      icons: action.payload.buildingBlockIconURL,
    };

    const response: unknown = yield call(ApplicationApi.createCustomBB, body);
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      toast.show("Building Block created successfully", { kind: "success" });
      yield put(openCreateBuildingBlockModal(false));
    }
  } catch (e) {
    toast.show(createMessage(ERROR_IN_EXPORTING_APP), {
      kind: "error",
    });
    yield put({
      type: ReduxActionErrorTypes.PARTIAL_EXPORT_ERROR,
      payload: {
        error: "Error exporting application",
      },
    });
  }
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
    toast.show(createMessage(ERROR_IN_EXPORTING_APP), {
      kind: "error",
    });
    yield put({
      type: ReduxActionErrorTypes.PARTIAL_EXPORT_ERROR,
      payload: {
        error: "Error exporting application",
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

export function* partialExportWidgetSagaForBB(widgetIds: string[]) {
  const canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = yield select(getWidgets);
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  const selectedWidgets = widgetIds.map((each) => canvasWidgets[each]);
  if (!selectedWidgets || !selectedWidgets.length) return;

  const gridSize = getBoundaryWidgetsFromCopiedWidgets(selectedWidgets);
  const deps: unknown = yield getRelatedEntitiesForWidgets(selectedWidgets);

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
  return [widgetsDSL, gridSize, deps];
}
