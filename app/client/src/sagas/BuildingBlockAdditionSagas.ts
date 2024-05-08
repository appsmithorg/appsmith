import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetAddChild } from "actions/pageActions";
import { runAction } from "actions/pluginActionActions";
import type { ApiResponse } from "api/ApiResponses";
import type { Template } from "api/TemplatesApi";
import ApplicationApi, {
  type ImportBuildingBlockToApplicationRequest,
  type ImportBuildingBlockToApplicationResponse,
} from "@appsmith/api/ApplicationApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { put, race, select, take, call } from "redux-saga/effects";
import { getBuildingBlockDragStartTimestamp } from "selectors/buildingBlocksSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getJSCollectionById,
} from "selectors/editorSelectors";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { saveBuildingBlockWidgetsToStore } from "./BuildingBlockSagas";
import { validateResponse } from "./ErrorSagas";
import { postPageAdditionSaga } from "./TemplatesSagas";
import { addChildSaga } from "./WidgetAdditionSagas";
import { getDragDetails, getWidgetByName } from "./selectors";
import type { WidgetDraggingUpdateParams } from "layoutSystems/common/canvasArenas/ArenaTypes";
import { addWidgetAndMoveWidgetsSaga } from "./CanvasSagas/DraggingCanvasSagas";
import { pasteWidget } from "actions/widgetActions";
import type { JSCollection } from "entities/JSCollection";
import { PluginType } from "entities/Action";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "./WidgetSelectUtils";

function* addBuildingBlockActionsToApplication(dragDetails: DragDetails) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const buildingblockName = dragDetails.newWidget.displayName;
  const buildingBlocks: Template[] = yield select(getTemplatesSelector);
  const currentPageId: string = yield select(getCurrentPageId);
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const selectedBuildingBlock = buildingBlocks.find(
    (buildingBlock) => buildingBlock.title === buildingblockName,
  ) as Template;

  const body: ImportBuildingBlockToApplicationRequest = {
    pageId: currentPageId,
    applicationId,
    workspaceId,
    templateId: selectedBuildingBlock.id,
  };

  // api call adds DS, queries and JS to page and returns new page dsl with building block
  const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
    yield call(ApplicationApi.importBuildingBlockToApplication, body);

  return response;
}

function* runSingleAction(actionId: string) {
  yield put(runAction(actionId));
  yield race([
    take(ReduxActionTypes.RUN_ACTION_SUCCESS),
    take(ReduxActionErrorTypes.RUN_ACTION_ERROR),
  ]);
}

function* runNewlyCreatedJSActions(
  jsActions: {
    collectionId: string;
    actionId: string;
  }[],
) {
  // Run each action sequentially. We have a max of 2-3 actions per building block.
  // If we run this in parallel, we will have a racing condition when multiple building blocks are drag and dropped quickly.
  for (const jsAction of jsActions) {
    const actionCollection: JSCollection = yield select(getJSCollectionById, {
      match: {
        params: {
          collectionId: jsAction.collectionId,
        },
      },
    });

    for (const action of actionCollection.actions) {
      yield put({
        type: ReduxActionTypes.START_EXECUTE_JS_FUNCTION,
        payload: {
          action,
          collection: actionCollection,
          from: "KEYBOARD_SHORTCUT",
          openDebugger: false,
        },
      });
      yield take(ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS);
    }
  }
}

function* runNewlyCreatedActions(actions: string[]) {
  // Run each action sequentially. We have a max of 2-3 actions per building block.
  // If we run this in parallel, we will have a racing condition when multiple building blocks are drag and dropped quickly.
  for (const action of actions) {
    yield runSingleAction(action);
  }
}

export function* loadBuildingBlocksIntoApplication(
  buildingBlockWidget: WidgetAddChild,
  skeletonLoaderId: string,
) {
  const { leftColumn, topRow } = buildingBlockWidget;
  try {
    const dragDetails: DragDetails = yield select(getDragDetails);
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const existingCopiedWidgets: unknown = yield call(getCopiedWidgets);
    const buildingBlockDragStartTimestamp: number = yield select(
      getBuildingBlockDragStartTimestamp,
    );

    // start loading for dropping building blocks
    yield put({
      type: ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_INIT,
    });

    // makes sure updateAndSaveLayout completes first for initial skeletonWidget addition
    const saveResult: unknown = yield race({
      success: take(ReduxActionTypes.SAVE_PAGE_SUCCESS),
      failure: take(ReduxActionErrorTypes.SAVE_PAGE_ERROR),
    });

    if (typeof saveResult === "object" && "failure" in saveResult!) {
      throw new Error("Save page failed");
    }

    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(addBuildingBlockActionsToApplication, dragDetails);
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      yield saveBuildingBlockWidgetsToStore(response);

      // remove skeleton loader just before pasting the building block
      yield put({
        type: WidgetReduxActionTypes.WIDGET_SINGLE_DELETE,
        payload: {
          widgetId: skeletonLoaderId,
          parentId: MAIN_CONTAINER_WIDGET_ID,
          disallowUndo: true,
          isShortcut: false,
        },
      });

      yield put(
        pasteWidget({
          groupWidgets: false,
          gridPosition: {
            top: topRow,
            left: leftColumn,
          },
        }),
      );

      const timeTakenToDropWidgetsInSeconds =
        (Date.now() - buildingBlockDragStartTimestamp) / 1000;
      yield call(postPageAdditionSaga, applicationId);

      // stop loading after pasting process is complete
      yield put({
        type: ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_SUCCESS,
      });
      // remove selecting of recently imported widgets
      yield put(selectWidgetInitAction(SelectionRequestType.Empty));

      if (
        response.data.onPageLoadActions &&
        response.data.onPageLoadActions.length > 0
      ) {
        const jsActions: { collectionId: string; actionId: string }[] = [];
        const nonJsActionsIds: string[] = [];

        response.data.onPageLoadActions.forEach((action) => {
          if (action.pluginType === PluginType.JS) {
            jsActions.push({
              collectionId: action.collectionId as string,
              actionId: action.id,
            });
          } else {
            nonJsActionsIds.push(action.id);
          }
        });

        yield runNewlyCreatedActions(nonJsActionsIds);
        yield runNewlyCreatedJSActions(jsActions);
      }

      const timeTakenToCompleteInMs = buildingBlockDragStartTimestamp
        ? Date.now() - buildingBlockDragStartTimestamp
        : 0;
      const timeTakenToCompleteInSeconds = timeTakenToCompleteInMs / 1000;

      AnalyticsUtil.logEvent("DROP_BUILDING_BLOCK_COMPLETED", {
        applicationId,
        workspaceId,
        source: "explorer",
        eventData: {
          buildingBlockName: dragDetails.newWidget.displayName,
          timeTakenToCompletion: timeTakenToCompleteInSeconds,
          timeTakenToDropWidgets: timeTakenToDropWidgetsInSeconds,
        },
      });
      yield put({
        type: ReduxActionTypes.RESET_BUILDING_BLOCK_DRAG_START_TIME,
      });

      if (existingCopiedWidgets) {
        yield call(saveCopiedWidgets, JSON.stringify(existingCopiedWidgets));
      }
    }
  } catch (error) {
    yield put({
      type: WidgetReduxActionTypes.WIDGET_SINGLE_DELETE,
      payload: {
        widgetId: skeletonLoaderId,
        parentId: MAIN_CONTAINER_WIDGET_ID,
        disallowUndo: true,
        isShortcut: false,
      },
    });
    yield put({
      type: ReduxActionErrorTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_ERROR,
    });
  }
}

export function* addBuildingBlockToCanvasSaga(
  addEntityAction: ReduxAction<WidgetAddChild>,
) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const dragDetails: DragDetails = yield select(getDragDetails);
  const buildingblockName = dragDetails.newWidget.displayName;
  const skeletonWidgetName = `loading_${buildingblockName
    .toLowerCase()
    .replace(/ /g, "_")}`;
  const addSkeletonWidgetAction: ReduxAction<
    WidgetAddChild & { shouldReplay: boolean }
  > = {
    ...addEntityAction,
    payload: {
      ...addEntityAction.payload,
      type: "SKELETON_WIDGET",
      widgetName: skeletonWidgetName,
      widgetId: MAIN_CONTAINER_WIDGET_ID,
      // so that the skeleton loader does not get included when the users uses the undo/redo
      shouldReplay: false,
    },
  };

  yield call(initiateBuildingBlockDropEvent, {
    applicationId,
    workspaceId,
    buildingblockName,
  });

  yield call(addChildSaga, addSkeletonWidgetAction);
  const skeletonWidget: FlattenedWidgetProps = yield select(
    getWidgetByName,
    skeletonWidgetName,
  );
  yield call(
    loadBuildingBlocksIntoApplication,
    addEntityAction.payload,
    skeletonWidget.widgetId,
  );
}

export function* addAndMoveBuildingBlockToCanvasSaga(
  actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[];
    canvasId: string;
  }>,
) {
  const applicationId: string = yield select(getCurrentApplicationId);
  const workspaceId: string = yield select(getCurrentApplicationId);
  const dragDetails: DragDetails = yield select(getDragDetails);
  const buildingblockName = dragDetails.newWidget.displayName;
  const skeletonWidgetName = `loading_${buildingblockName
    .toLowerCase()
    .replace(/ /g, "_")}`;

  yield call(addWidgetAndMoveWidgetsSaga, {
    ...actionPayload,
    payload: {
      ...actionPayload.payload,
      // so that the skeleton loader does not get included when the users uses the undo/redo
      shouldReplay: false,
      newWidget: {
        ...actionPayload.payload.newWidget,
        type: "SKELETON_WIDGET",
        widgetName: skeletonWidgetName,
        widgetId: MAIN_CONTAINER_WIDGET_ID,
      },
    },
  });
  yield call(initiateBuildingBlockDropEvent, {
    applicationId,
    workspaceId,
    buildingblockName,
  });

  const skeletonWidget: FlattenedWidgetProps = yield select(
    getWidgetByName,
    skeletonWidgetName,
  );
  yield call(
    loadBuildingBlocksIntoApplication,
    actionPayload.payload.newWidget,
    skeletonWidget.widgetId,
  );
}
