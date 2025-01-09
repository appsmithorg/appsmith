import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { cloneDeep, isString } from "lodash";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, take } from "redux-saga/effects";
import {
  getCanvasWidth,
  getCurrentBasePageId,
  getCurrentPageId,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { generateReactKey } from "utils/generators";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { getWidgets, getWidgetsMeta } from "../selectors";

import { builderURL } from "ee/RouteBuilder";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { nextAvailableRowInContainer } from "entities/Widget/utils";
import type { GridProps, SpaceMap } from "reflow/reflowTypes";
import { getDataTree } from "selectors/dataTreeSelectors";
import { flashElementsById } from "utils/helpers";
import history from "utils/history";
import type { ColumnProperties } from "widgets/TableWidget/component/Constants";
import {
  addChildToPastedFlexLayers,
  getNewFlexLayers,
  isStack,
  pasteWidgetInFlexLayers,
} from "../../layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  executeWidgetBlueprintBeforeOperations,
  traverseTreeAndExecuteBlueprintChildOperations,
} from "../WidgetBlueprintSagas";
import type { CopiedWidgetGroup } from "../WidgetOperationUtils";
import {
  getBoundaryWidgetsFromCopiedGroups,
  getNextWidgetName,
  getReflowedPositions,
  handleIfParentIsListWidgetWhilePasting,
  handleSpecificCasesWhilePasting,
} from "../WidgetOperationUtils";

import { updateAndSaveAnvilLayout } from "layoutSystems/anvil/utils/anvilChecksUtils";
import { updateWidgetPositions } from "layoutSystems/autolayout/utils/positionUtils";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import {
  getNewPositions,
  handleWidgetDynamicBindingPathList,
  handleWidgetDynamicPropertyPathList,
  handleWidgetDynamicTriggerPathList,
  handleJSONFormPropertiesListedInDynamicBindingPath,
} from "../PasteWidgetUtils";

import ApplicationApi, {
  type ImportBuildingBlockToApplicationRequest,
  type ImportBuildingBlockToApplicationResponse,
} from "ee/api/ApplicationApi";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import type { WidgetAddChild } from "actions/pageActions";
import { runAction } from "actions/pluginActionActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ApiResponse } from "api/ApiResponses";
import type { Template } from "api/TemplatesApi.types";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import type { JSCollection } from "entities/JSCollection";
import type { WidgetDraggingUpdateParams } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { race } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getBuildingBlockDragStartTimestamp } from "selectors/buildingBlocksSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import {
  addNewlyAddedActionsToRedux,
  saveBuildingBlockWidgetsToStore,
  updateWidgetsNameInNewQueries,
} from ".";
import { addWidgetAndMoveWidgetsSaga } from "../CanvasSagas/DraggingCanvasSagas";
import { validateResponse } from "../ErrorSagas";
import { postPageAdditionSaga } from "../TemplatesSagas";
import { addChildSaga } from "../WidgetAdditionSagas";
import { calculateNewWidgetPosition } from "../WidgetOperationSagas";
import { getDragDetails, getWidgetByName } from "../selectors";
import { getJSCollection } from "ee/selectors/entitiesSelector";

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

  try {
    // api call adds DS, queries and JS to page and returns new page dsl with building block
    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(ApplicationApi.importBuildingBlockToApplication, body);

    return response;
  } catch (error) {
    log.debug(
      "Error making API call to importBuildingBlockToApplication",
      error,
    );
    throw error;
  }
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
    const actionCollection: JSCollection = yield select(
      getJSCollection,
      jsAction.collectionId,
    );

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
          parentId: buildingBlockWidget.widgetId,
          disallowUndo: true,
          isShortcut: false,
        },
      });

      yield pasteBuildingBlockWidgetsSaga(
        {
          top: topRow,
          left: leftColumn,
        },
        buildingBlockWidget.widgetId,
        response.data.newActionList,
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
    log.error("Error loading building blocks into application", error);
    yield put({
      type: WidgetReduxActionTypes.WIDGET_SINGLE_DELETE,
      payload: {
        widgetId: skeletonLoaderId,
        parentId: buildingBlockWidget.widgetId,
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
  const workspaceId: string = yield select(getCurrentWorkspaceId);
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
    {
      ...actionPayload.payload.newWidget,
      widgetId: actionPayload.payload.canvasId,
    },
    skeletonWidget.widgetId,
  );
}

/**
 * This saga create a new widget from the copied one to store.
 * It allows using both mouseLocation or gridPosition to locate where the copied widgets should be dropped.
 * If gridPosition is available, use it, else, calculate gridPosition from mousePosition
 */
/**
 * Saga function that handles the pasting of building block widgets.
 *
 * @param gridPosition - The position of the grid where the widgets will be pasted.
 */
export function* pasteBuildingBlockWidgetsSaga(
  gridPosition: {
    top: number;
    left: number;
  },
  pastingIntoWidgetId: string,
  newActions: Action[] = [],
) {
  const {
    flexLayers,
    widgets: copiedWidgets,
  }: {
    widgets: CopiedWidgetGroup[];
    flexLayers: FlexLayer[];
  } = yield getCopiedWidgets();

  const copiedWidgetGroups = copiedWidgets ? [...copiedWidgets] : [];

  const newlyCreatedWidgetIds: string[] = [];
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let widgets: CanvasWidgetsReduxState = canvasWidgets;

  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const mainCanvasWidth: number = yield select(getCanvasWidth);

  try {
    if (
      // to avoid invoking old way of copied widgets implementaion
      !Array.isArray(copiedWidgetGroups) ||
      !copiedWidgetGroups.length
    )
      return;

    const {
      leftMostWidget,
      topMostWidget,
      totalWidth: copiedTotalWidth,
    } = getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

    const nextAvailableRow: number = nextAvailableRowInContainer(
      pastingIntoWidgetId,
      widgets,
    );

    // new pasting positions, the variables are undefined if the positions cannot be calculated,
    // then it pastes the regular way at the bottom of the canvas
    const {
      gridProps,
      newPastingPositionMap,
      reflowedMovementMap,
    }: {
      canvasId: string | undefined;
      gridProps: GridProps | undefined;
      newPastingPositionMap: SpaceMap | undefined;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reflowedMovementMap: any;
    } = yield call(
      getNewPositions,
      copiedWidgetGroups,
      copiedTotalWidth,
      topMostWidget.topRow,
      leftMostWidget.leftColumn,
      { gridPosition },
      pastingIntoWidgetId,
    );

    for (const widgetGroup of copiedWidgetGroups) {
      //This is required when you cut the widget as CanvasWidgetState doesn't have the widget anymore
      const widgetType = widgetGroup.list.find(
        (widget) => widget.widgetId === widgetGroup.widgetId,
      )?.type;

      if (!widgetType) break;

      yield call(
        executeWidgetBlueprintBeforeOperations,
        BlueprintOperationTypes.BEFORE_PASTE,
        {
          parentId: pastingIntoWidgetId,
          widgetId: widgetGroup.widgetId,
          widgets,
          widgetType,
        },
      );
    }

    const widgetIdMap: Record<string, string> = {};
    const reverseWidgetIdMap: Record<string, string> = {};
    const widgetNameMap: Record<string, string> = {};

    yield all(
      copiedWidgetGroups.map((copiedWidgets) =>
        call(function* () {
          // Don't try to paste if there is no copied widget
          if (!copiedWidgets) return;

          const copiedWidgetId = copiedWidgets.widgetId;
          const unUpdatedCopyOfWidget = copiedWidgets.list[0];
          const newTopRow = topMostWidget.topRow;

          const copiedWidget = {
            ...unUpdatedCopyOfWidget,
            topRow: unUpdatedCopyOfWidget.topRow - newTopRow,
            bottomRow: unUpdatedCopyOfWidget.bottomRow - newTopRow,
          };

          // Compute the new widget's positional properties
          const newWidgetPosition = calculateNewWidgetPosition(
            copiedWidget,
            pastingIntoWidgetId,
            widgets,
            nextAvailableRow,
            newPastingPositionMap,
            true,
            false,
            false,
          );

          // Get a flat list of all the widgets to be updated
          const widgetList = copiedWidgets.list;
          const newWidgetList: FlattenedWidgetProps[] = [];
          // Generate new widgetIds for the flat list of all the widgets to be updated

          widgetList.forEach((widget) => {
            // Create a copy of the widget properties
            const newWidget = cloneDeep(widget);

            newWidget.widgetId = generateReactKey();
            // Add the new widget id so that it maps the previous widget id
            widgetIdMap[widget.widgetId] = newWidget.widgetId;
            reverseWidgetIdMap[newWidget.widgetId] = widget.widgetId;
            // Add the new widget to the list
            newWidgetList.push(newWidget);
          });

          // For each of the new widgets generated
          const evalTree: DataTree = yield select(getDataTree);

          for (let i = 0; i < newWidgetList.length; i++) {
            const widget = newWidgetList[i];
            const oldWidgetName = widget.widgetName;
            let newWidgetName = oldWidgetName;

            newWidgetName = getNextWidgetName(widgets, widget.type, evalTree, {
              prefix: oldWidgetName,
              startWithoutIndex: true,
            });

            // Update the children widgetIds if it has children
            if (widget.children && widget.children.length > 0) {
              widget.children.forEach(
                (childWidgetId: string, index: number) => {
                  if (widget.children) {
                    widget.children[index] = widgetIdMap[childWidgetId];
                  }
                },
              );
            }

            if (oldWidgetName !== newWidgetName) {
              newActions = updateWidgetsNameInNewQueries(
                oldWidgetName,
                newWidgetName,
                newActions,
              );
            }

            handleSelfWidgetReferencesDuringBuildingBlockPaste(
              widget,
              widgetIdMap,
              oldWidgetName,
              newWidgetName,
            );

            // If it is the copied widget, update position properties
            if (widget.widgetId === widgetIdMap[copiedWidget.widgetId]) {
              //when the widget is a modal widget, it has to paste on the main container
              const pastingParentId =
                widget.type === "MODAL_WIDGET"
                  ? MAIN_CONTAINER_WIDGET_ID
                  : pastingIntoWidgetId;
              const { bottomRow, leftColumn, rightColumn, topRow } =
                newWidgetPosition;

              widget.leftColumn = leftColumn;
              widget.topRow = topRow;
              widget.bottomRow = bottomRow;
              widget.rightColumn = rightColumn;
              widget.parentId = pastingParentId;
              // Also, update the parent widget in the canvas widgets
              // to include this new copied widget's id in the parent's children
              let parentChildren = [widget.widgetId];
              const widgetChildren = widgets[pastingParentId].children;

              if (widgetChildren && Array.isArray(widgetChildren)) {
                // Add the new child to existing children after it's original siblings position.

                const originalWidgetId: string = widgetList[i].widgetId;
                const originalWidgetIndex: number =
                  widgetChildren.indexOf(originalWidgetId);

                parentChildren = [
                  ...widgetChildren.slice(0, originalWidgetIndex + 1),
                  ...parentChildren,
                  ...widgetChildren.slice(originalWidgetIndex + 1),
                ];
              }

              widgets = {
                ...widgets,
                [pastingParentId]: {
                  ...widgets[pastingParentId],
                  children: parentChildren,
                },
              };

              // If the copied widget's boundaries exceed the parent's
              // Make the parent scrollable
              if (
                widgets[pastingParentId].bottomRow *
                  widgets[widget.parentId].parentRowSpace <=
                  widget.bottomRow * widget.parentRowSpace &&
                !widget.detachFromLayout
              ) {
                const parentOfPastingWidget = widgets[pastingParentId].parentId;

                if (
                  parentOfPastingWidget &&
                  widget.parentId !== MAIN_CONTAINER_WIDGET_ID
                ) {
                  const parent = widgets[parentOfPastingWidget];

                  widgets[parentOfPastingWidget] = {
                    ...parent,
                    shouldScrollContents: true,
                  };
                }
              }
            } else {
              // For all other widgets in the list
              // (These widgets will be descendants of the copied widget)
              // This means, that their parents will also be newly copied widgets
              // Update widget's parent widget ids with the new parent widget ids
              const newParentId = newWidgetList.find((newWidget) =>
                widget.parentId
                  ? newWidget.widgetId === widgetIdMap[widget.parentId]
                  : false,
              )?.widgetId;

              if (newParentId) widget.parentId = newParentId;
            }

            // Generate a new unique widget name
            widget.widgetName = newWidgetName;

            widgetNameMap[oldWidgetName] = widget.widgetName;
            // Add the new widget to the canvas widgets
            widgets[widget.widgetId] = widget;

            /**
             * If new parent is a vertical stack, then update flex layers.
             */
            if (widget.parentId) {
              const pastingIntoWidget = widgets[widget.parentId];

              if (
                pastingIntoWidget &&
                isStack(widgets, pastingIntoWidget) &&
                (pastingIntoWidgetId !== pastingIntoWidget.widgetId ||
                  !flexLayers ||
                  flexLayers.length <= 0)
              ) {
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const metaProps: Record<string, any> =
                  yield select(getWidgetsMeta);

                if (widget.widgetId === widgetIdMap[copiedWidget.widgetId])
                  widgets = pasteWidgetInFlexLayers(
                    widgets,
                    widget.parentId,
                    widget,
                    reverseWidgetIdMap[widget.widgetId],
                    isMobile,
                    mainCanvasWidth,
                    metaProps,
                  );
                else if (widget.type !== "CANVAS_WIDGET")
                  widgets = addChildToPastedFlexLayers(
                    widgets,
                    widget,
                    widgetIdMap,
                    isMobile,
                    mainCanvasWidth,
                    metaProps,
                  );
              }
            }
          }

          newlyCreatedWidgetIds.push(widgetIdMap[copiedWidgetId]);

          // 1. updating template in the copied widget and deleting old template associations
          // 2. updating dynamicBindingPathList in the copied grid widget
          for (let i = 0; i < newWidgetList.length; i++) {
            const widget = newWidgetList[i];

            widgets =
              handleOtherWidgetReferencesWhilePastingBuildingBlockWidget(
                widget,
                widgets,
                widgetNameMap,
                newWidgetList,
              );
          }
        }),
      ),
    );

    yield addNewlyAddedActionsToRedux(newActions);

    //calculate the new positions of the reflowed widgets
    let reflowedWidgets = getReflowedPositions(
      widgets,
      gridProps,
      reflowedMovementMap,
    );

    if (
      pastingIntoWidgetId &&
      reflowedWidgets[pastingIntoWidgetId] &&
      flexLayers &&
      flexLayers.length > 0
    ) {
      const newFlexLayers = getNewFlexLayers(flexLayers, widgetIdMap);

      reflowedWidgets[pastingIntoWidgetId] = {
        ...reflowedWidgets[pastingIntoWidgetId],
        flexLayers: [
          ...(reflowedWidgets[pastingIntoWidgetId]?.flexLayers || []),
          ...newFlexLayers,
        ],
      };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metaProps: Record<string, any> = yield select(getWidgetsMeta);

      reflowedWidgets = updateWidgetPositions(
        reflowedWidgets,
        pastingIntoWidgetId,
        isMobile,
        mainCanvasWidth,
        false,
        metaProps,
      );
    }

    // some widgets need to update property of parent if the parent have CHILD_OPERATIONS
    // so here we are traversing up the tree till we get to MAIN_CONTAINER_WIDGET_ID
    // while traversing, if we find any widget which has CHILD_OPERATION, we will call the fn in it
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      traverseTreeAndExecuteBlueprintChildOperations,
      reflowedWidgets[pastingIntoWidgetId],
      newlyCreatedWidgetIds.filter(
        (widgetId) => !reflowedWidgets[widgetId]?.detachFromLayout,
      ),
      reflowedWidgets,
    );

    yield call(updateAndSaveAnvilLayout, updatedWidgets);

    const basePageId: string = yield select(getCurrentBasePageId);

    if (copiedWidgetGroups && copiedWidgetGroups.length > 0) {
      history.push(builderURL({ basePageId }));
    }

    yield put({
      type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
      payload: newlyCreatedWidgetIds,
    });
    yield put(generateAutoHeightLayoutTreeAction(true, true));

    //if pasting at the bottom of the canvas, then flash it.
    if (!newPastingPositionMap) {
      flashElementsById(newlyCreatedWidgetIds, 100);
    }
  } catch (error) {
    throw error;
  }
}

function handleSelfWidgetReferencesDuringBuildingBlockPaste(
  widget: FlattenedWidgetProps,
  widgetIdMap: Record<string, string>,
  oldWidgetName: string,
  newWidgetName: string,
) {
  try {
    switch (widget.type) {
      case "TABS_WIDGET":
        // Update the tabs for the tabs widget.
        if (widget.tabsObj) {
          const tabs = Object.values(widget.tabsObj);

          if (Array.isArray(tabs)) {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            widget.tabsObj = tabs.reduce((obj: any, tab: any) => {
              tab.widgetId = widgetIdMap[tab.widgetId];
              obj[tab.id] = tab;

              return obj;
            }, {});
          }
        }

        break;
      case "TABLE_WIDGET_V2":
      case "TABLE_WIDGET":
        // Update the table widget column properties
        if (widget.primaryColumns) {
          Object.entries(widget.primaryColumns).forEach(
            ([columnId, column]) => {
              Object.entries(column as ColumnProperties).forEach(
                ([key, value]) => {
                  if (isString(value)) {
                    widget.primaryColumns[columnId][key] = value.replace(
                      `${oldWidgetName}.`,
                      `${newWidgetName}.`,
                    );
                  }
                },
              );
            },
          );
          widget.widgetName = newWidgetName;
        }

        break;
      case "MULTI_SELECT_WIDGET_V2":
      case "SELECT_WIDGET":
        // Update the Select widget defaultValue properties
        if (isString(widget.defaultOptionValue)) {
          widget.defaultOptionValue = widget.defaultOptionValue.replaceAll(
            `${oldWidgetName}.`,
            `${newWidgetName}.`,
          );
        }

        widget.widgetName = newWidgetName;
        break;
      case "JSON_FORM_WIDGET":
        handleJSONFormPropertiesListedInDynamicBindingPath(
          widget,
          oldWidgetName,
          newWidgetName,
        );
        break;
    }
  } catch (error) {
    log.debug(`Error updating widget properties of ${widget.type}`, error);
  }
}

function handleOtherWidgetReferencesWhilePastingBuildingBlockWidget(
  widget: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  widgetNameMap: Record<string, string>,
  newWidgetList: FlattenedWidgetProps[],
) {
  if (["LIST_WIDGET", "LIST_WIDGET_V2", "MODAL_WIDGET"].includes(widget.type)) {
    widgets = handleSpecificCasesWhilePasting(
      widget,
      widgets,
      widgetNameMap,
      newWidgetList,
    );
  }

  if (widget.dynamicTriggerPathList) {
    handleWidgetDynamicTriggerPathList(widgetNameMap, widget);
  }

  if (widget.dynamicBindingPathList) {
    handleWidgetDynamicBindingPathList(widgetNameMap, widget);
  }

  if (widget.dynamicPropertyPathList) {
    handleWidgetDynamicPropertyPathList(widgetNameMap, widget);
  }

  widgets = handleIfParentIsListWidgetWhilePasting(widget, widgets);

  return widgets;
}
