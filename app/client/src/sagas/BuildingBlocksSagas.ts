import type {
  ImportBuildingBlockToApplicationRequest,
  ImportBuildingBlockToApplicationResponse,
} from "@appsmith/api/ApplicationApi";
import ApplicationApi from "@appsmith/api/ApplicationApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getActions,
  getCanvasWidgets,
} from "@appsmith/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "@shared/dsl/src/migrate/types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetAddChild } from "actions/pageActions";
import { runAction } from "actions/pluginActionActions";
import {
  setCurrentForkingBuildingBlockName,
  showStarterBuildingBlockDatasourcePrompt,
} from "actions/templateActions";
import { pasteWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ApiResponse } from "api/ApiResponses";
import type { Template } from "api/TemplatesApi";
import { STARTER_BUILDING_BLOCKS } from "constants/TemplatesConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { WidgetLayoutPositionInfo } from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import {
  all,
  call,
  delay,
  put,
  race,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { getBuildingBlockDragStartTimestamp } from "selectors/buildingBlocksSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { postPageAdditionSaga } from "./TemplatesSagas";
import { addChildSaga } from "./WidgetAdditionSagas";
import { SelectionRequestType } from "./WidgetSelectUtils";
import { getDragDetails, getWidgetByName } from "./selectors";

const isAirgappedInstance = isAirgapped();

export function* saveBuildingBlockWidgetsToStore(
  response: ApiResponse<ImportBuildingBlockToApplicationResponse>,
) {
  const buildingBlockDsl = JSON.parse(response.data.widgetDsl);
  const buildingBlockWidgets = buildingBlockDsl.children;
  const flattenedBlockWidgets = buildingBlockWidgets.map(
    (widget: WidgetProps) => flattenDSL(widget),
  );

  const widgetsToPasteInCanvas: CopiedWidgetData[] = yield all(
    flattenedBlockWidgets.map((widget: FlattenedWidgetProps, index: number) => {
      const widgetPositionInfo: WidgetLayoutPositionInfo | null = null;
      return {
        hierarchy: getWidgetHierarchy(
          buildingBlockWidgets[index].type,
          buildingBlockWidgets[index].widgetId,
        ),
        list: Object.values(widget)
          .map((obj) => ({ ...obj }))
          .reverse(),
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: buildingBlockWidgets[index].widgetId,
        widgetPositionInfo,
      };
    }),
  );

  yield saveCopiedWidgets(
    JSON.stringify({
      widgets: widgetsToPasteInCanvas,
      flexLayers: [],
    }),
  );
}

function* apiCallForForkBuildingBlockToApplication(request: {
  templateId: string;
  activePageId: string;
  applicationId: string;
  workspaceId: string;
  templateName: string;
}) {
  try {
    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(ApplicationApi.importBuildingBlockToApplication, {
        pageId: request.activePageId,
        templateId: request.templateId,
        applicationId: request.applicationId,
        workspaceId: request.workspaceId,
      });
    const isValid: boolean = yield validateResponse(response);

    yield select(getCanvasWidgets);

    if (isValid) {
      yield saveBuildingBlockWidgetsToStore(response);

      yield put(pasteWidget(false, { x: 0, y: 0 }));
      yield call(postPageAdditionSaga, request.applicationId);
      // remove selecting of recently imported widgets
      yield put(selectWidgetInitAction(SelectionRequestType.Empty));

      // run all actions in the building block, if any, to populate the page with data
      if (
        response.data.onPageLoadActions &&
        response.data.onPageLoadActions.length > 0
      ) {
        yield all(
          response.data.onPageLoadActions.map(function* (action) {
            yield put(runAction(action.id));
          }),
        );
      }
      yield put({
        type: ReduxActionTypes.IMPORT_STARTER_TEMPLATE_TO_APPLICATION_SUCCESS,
      });

      // Show datasource prompt after 3 seconds
      yield delay(STARTER_BUILDING_BLOCKS.DATASOURCE_PROMPT_DELAY);
      yield put(setCurrentForkingBuildingBlockName(request.templateName));
      yield put(showStarterBuildingBlockDatasourcePrompt(request.activePageId));
    } else {
      throw new Error("Failed importing starter building block");
    }
  } catch (error) {
    throw error;
  }
}

function* forkStarterBuildingBlockToApplicationSaga(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
  }>,
) {
  const existingCopiedWidgets: unknown = yield call(getCopiedWidgets);
  try {
    const activePageId: string = yield select(getCurrentPageId);
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);

    yield call(apiCallForForkBuildingBlockToApplication, {
      templateId: action.payload.templateId,
      activePageId,
      applicationId,
      workspaceId,
      templateName: action.payload.templateName,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_ERROR,
    });
  }
  if (existingCopiedWidgets) {
    yield call(saveCopiedWidgets, JSON.stringify(existingCopiedWidgets));
  }
}

function* addBuildingBlockActionsToApp(dragDetails: DragDetails) {
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
  yield take(ReduxActionTypes.RUN_ACTION_SUCCESS);
}

function* runNewlyCreatedActions(
  actionsBeforeAddingBuildingBlock: ActionDataState,
  actionsAfterAddingBuildingBlocks: ActionDataState,
) {
  const actionIdsBeforeAddingBB = actionsBeforeAddingBuildingBlock.map(
    (obj) => obj.config.id,
  );

  const newlyAddedActions = actionsAfterAddingBuildingBlocks.filter(
    (obj) => !actionIdsBeforeAddingBB.includes(obj.config.id),
  );

  // Run each action sequentially. We have a max of 2-3 actions per building block.
  // If we run this in parallel, we will have a racing condition when multiple building blocks are drag and dropped quickly.
  for (const action of newlyAddedActions) {
    if (action.config.executeOnLoad) {
      yield runSingleAction(action.config.id);
    }
  }
}

export function* addBuildingBlockToApplication(
  buildingBlockWidget: WidgetAddChild,
  skeletonLoaderId: string,
) {
  const { leftColumn, topRow } = buildingBlockWidget;
  try {
    const dragDetails: DragDetails = yield select(getDragDetails);
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const actionsBeforeAddingBuildingBlock: ActionDataState =
      yield select(getActions);
    const existingCopiedWidgets: unknown = yield call(getCopiedWidgets);
    const buildingBlockDragStartTimestamp: number = yield select(
      getBuildingBlockDragStartTimestamp,
    );

    // start loading for dragging building blocks
    yield put({
      type: ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_INIT,
    });

    // makes sure updateAndSaveLayout completes first for skeletonWidget addition
    const saveResult: unknown = yield race({
      success: take(ReduxActionTypes.SAVE_PAGE_SUCCESS),
      failure: take(ReduxActionErrorTypes.SAVE_PAGE_ERROR),
    });

    if (typeof saveResult === "object" && "failure" in saveResult!) {
      throw new Error("Save page failed");
    }

    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(addBuildingBlockActionsToApp, dragDetails);
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

      yield put({
        type: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
        payload: {
          groupWidgets: false,
          gridPosition: {
            top: topRow,
            left: leftColumn,
          },
        },
      });

      const timeTakenToDropWidgetsInSeconds =
        (Date.now() - buildingBlockDragStartTimestamp) / 1000;
      yield call(postPageAdditionSaga, applicationId);

      // stop loading after pasting process is complete
      yield put({
        type: ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_SUCCESS,
      });

      const actionsAfterAddingBuildingBlocks: ActionDataState =
        yield select(getActions);

      if (
        response.data.onPageLoadActions &&
        response.data.onPageLoadActions.length > 0
      ) {
        yield runNewlyCreatedActions(
          actionsBeforeAddingBuildingBlock,
          actionsAfterAddingBuildingBlocks,
        );
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
    addBuildingBlockToApplication,
    addEntityAction.payload,
    skeletonWidget.widgetId,
  );
}

export default function* watchActionSagas() {
  if (!isAirgappedInstance)
    yield all([
      takeEvery(
        ReduxActionTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_INIT,
        forkStarterBuildingBlockToApplicationSaga,
      ),
    ]);
}
