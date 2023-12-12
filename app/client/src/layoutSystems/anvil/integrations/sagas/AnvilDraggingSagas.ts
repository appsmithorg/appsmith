import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
} from "WidgetProvider/constants";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  CrudWidgetsPayload,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import type {
  AnvilHighlightInfo,
  WidgetLayoutProps,
} from "../../utils/anvilTypes";
import { getWidget, getWidgets } from "sagas/selectors";
import { addWidgetsToPreset } from "../../utils/layouts/update/additionUtils";
import { moveWidgets } from "../../utils/layouts/update/moveUtils";
import type {
  AnvilMoveWidgetsPayload,
  AnvilNewWidgetsPayload,
} from "../actions/actionTypes";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  addWidgetsToMainCanvasLayout,
  moveWidgetsToMainCanvas,
} from "layoutSystems/anvil/utils/layouts/update/mainCanvasLayoutUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { addWidgetToSection } from "./sections/utils";
import { moveWidgetsToSection } from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import {
  performAnvilChecks,
  saveAnvilLayout,
} from "../actions/saveLayoutActions";
import {
  getParentUpdatesPostWidgetDeletion,
  updateAnvilParentPostWidgetDeletion,
} from "layoutSystems/anvil/utils/layouts/update/deletionUtils";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { updateAndSaveLayout } from "actions/pageActions";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { crudMultipleWidgets } from "actions/controlActions";
import { callEvalWithoutReplay } from "sagas/autoHeightSagas/batcher";

export function* getMainCanvasLastRowHighlight() {
  const mainCanvas: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );
  const layoutId: string = mainCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = mainCanvas.layout[0].layout.length;
  return {
    canvasId: MAIN_CONTAINER_WIDGET_ID,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  };
}

function* addSuggestedWidgetsAnvilSaga(
  actionPayload: ReduxAction<{
    newWidget: {
      newWidgetId: string;
      type: string;
      rows?: number;
      columns?: number;
      props: WidgetProps;
    };
  }>,
) {
  const { newWidget } = actionPayload.payload;
  const wdsEntry = Object.entries(WDS_V2_WIDGET_MAP).find(
    ([legacyType]) => legacyType === newWidget.type,
  );
  if (wdsEntry) {
    const [, wdsType] = wdsEntry;
    const newWidgetParams = {
      width: (newWidget.rows || 0 / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns || 0 * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.newWidgetId,
      parentId: MAIN_CONTAINER_WIDGET_ID,
      type: wdsType,
    };
    const mainCanvasHighLight: AnvilHighlightInfo = yield call(
      getMainCanvasLastRowHighlight,
    );
    const res: {
      widgets: CanvasWidgetsReduxState;
      updatesPayload: CrudWidgetsPayload;
    } = yield call(
      addNewChildToDSL,
      mainCanvasHighLight,
      newWidgetParams,
      true,
      false,
    );
    let updatedWidgets: CanvasWidgetsReduxState = res.widgets;
    updatedWidgets[newWidgetParams.newWidgetId] = {
      ...updatedWidgets[newWidgetParams.newWidgetId],
      ...newWidget.props,
    };
    console.log("#### add suggested widgets", { res });
    yield put(performAnvilChecks(res.updatesPayload));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [
        newWidgetParams.newWidgetId,
      ]),
    );
  }
}

export function* addNewChildToDSL(
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
  isMainCanvas: boolean,
  isSection: boolean,
) {
  const { alignment, canvasId } = highlight;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Execute Blueprint operation to update widget props before creation.
  const newParams: { [key: string]: any } = yield call(
    executeWidgetBlueprintBeforeOperations,
    BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
    {
      parentId: canvasId,
      widgetId: newWidget.newWidgetId,
      widgets: allWidgets,
      widgetType: newWidget.type,
    },
  );
  const updatedParams: any = { ...newWidget, ...newParams };

  // Create and add widget.
  let updatedWidgets: CanvasWidgetsReduxState = yield call(
    getUpdateDslAfterCreatingChild,
    {
      ...updatedParams,
      widgetId: canvasId,
    },
  );
  const draggedWidgets: WidgetLayoutProps[] = [
    {
      alignment,
      widgetId: newWidget.newWidgetId,
      widgetType: newWidget.type,
    },
  ];

  let updatesPayload: CrudWidgetsPayload = {
    add: {
      [newWidget.newWidgetId]: updatedWidgets[newWidget.newWidgetId],
    },
    remove: [],
    update: {},
  };

  if (!!isMainCanvas) {
    const res: {
      updatesPayload: CrudWidgetsPayload;
      widgets: CanvasWidgetsReduxState;
    } = yield call(
      addWidgetToMainCanvas,
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget.newWidgetId,
      updatesPayload,
    );
    updatesPayload = res.updatesPayload;
  } else if (!!isSection) {
    const res: {
      updatesPayload: CrudWidgetsPayload;
      widgets: CanvasWidgetsReduxState;
    } = yield call(
      addWidgetToSection,
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget.newWidgetId,
      updatesPayload,
    );
    updatesPayload = res.updatesPayload;
  } else {
    const changes: UpdateWidgetsPayload = addWidgetToGenericLayout(
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget,
    );
    Object.keys(changes).forEach((widgetId: string) => {
      updatesPayload.update = updatesPayload.update ?? {};
      updatesPayload.update[widgetId] = [
        ...(updatesPayload?.update[widgetId] ?? []),
        ...changes[widgetId],
      ];
    });
  }
  console.log("#### addNewChild", { updatesPayload });
  return { widgets: updatedWidgets, updatesPayload };
}

function* addWidgetsSaga(actionPayload: ReduxAction<AnvilNewWidgetsPayload>) {
  try {
    const start = performance.now();
    const {
      dragMeta: { draggedOn },
      highlight,
      newWidget,
    } = actionPayload.payload;
    const isMainCanvas = draggedOn === "MAIN_CANVAS";
    const isSection = draggedOn === "SECTION";
    const res: {
      updatesPayload: CrudWidgetsPayload;
      widgets: CanvasWidgetsReduxState;
    } = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
      !!isMainCanvas,
      !!isSection,
    );
    yield put(performAnvilChecks(res.updatesPayload));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [newWidget.newWidgetId]),
    );
    log.debug("Anvil : add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        error,
      },
    });
  }
}

function* addWidgetToMainCanvas(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  widgetId: string,
  updatesPayload: CrudWidgetsPayload,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  updatedWidgets = {
    ...updatedWidgets,
    [highlight.canvasId]: {
      ...updatedWidgets[highlight.canvasId],
      children: updatedWidgets[highlight.canvasId].children?.filter(
        (each: string) => each !== widgetId,
      ),
    },
  };
  const res: {
    updatesPayload: CrudWidgetsPayload;
    widgets: CanvasWidgetsReduxState;
  } = yield call(
    addWidgetsToMainCanvasLayout,
    updatedWidgets,
    draggedWidgets,
    highlight,
    updatesPayload,
  );

  return { widgets: res.widgets, updatesPayload: res.updatesPayload };
}

function addWidgetToGenericLayout(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
): UpdateWidgetsPayload {
  const canvasWidget = allWidgets[highlight.canvasId];
  const canvasLayout = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();
  /**
   * Add new widget to the children of parent canvas.
   * Also add it to parent canvas' layout.
   */
  return {
    [canvasWidget.widgetId]: [
      {
        propertyPath: "layout",
        propertyValue: addWidgetsToPreset(
          canvasLayout,
          highlight,
          draggedWidgets,
        ),
      },
    ],
    [newWidget.newWidgetId]: [
      // TODO: @Ashok - This is a temp fix, widget dimensions will be self computed by widgets
      {
        propertyPath: "height",
        propertyValue: newWidget.height,
      },
      {
        propertyPath: "width",
        propertyValue: newWidget.width,
      },
    ],
  };
}

/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
function* moveWidgetsSaga(actionPayload: ReduxAction<AnvilMoveWidgetsPayload>) {
  try {
    const start = performance.now();
    const {
      dragMeta: { draggedOn },
      highlight,
      movedWidgets,
    } = actionPayload.payload;
    const isMainCanvas = draggedOn === "MAIN_CANVAS";
    const isSection = draggedOn === "SECTION";
    const movedWidgetIds = movedWidgets.map((each) => each.widgetId);
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    let updatedWidgets: CanvasWidgetsReduxState = allWidgets;
    let updatesPayload: CrudWidgetsPayload = {};

    if (isMainCanvas) {
      /**
       * * Widgets are dropped on to Main Canvas.
       */
      const res: {
        updatesPayload: CrudWidgetsPayload;
        widgets: CanvasWidgetsReduxState;
      } = yield call(
        moveWidgetsToMainCanvas,
        allWidgets,
        movedWidgetIds,
        highlight,
      );
      updatesPayload = res.updatesPayload;
    } else if (isSection) {
      /**
       * Widget are dropped into a Section.
       */
      const res: {
        updatesPayload: CrudWidgetsPayload;
        widgets: CanvasWidgetsReduxState;
      } = yield call(
        moveWidgetsToSection,
        allWidgets,
        movedWidgetIds,
        highlight,
      );
      updatesPayload = res.updatesPayload;
    } else {
      updatedWidgets = moveWidgets(allWidgets, movedWidgetIds, highlight);
    }
    yield put(performAnvilChecks(updatesPayload));
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

function* updateAndSaveAnvilLayoutSaga(
  action: ReduxAction<{
    isRetry?: boolean;
    widgets: CanvasWidgetsReduxState;
    shouldReplay?: boolean;
    updatedWidgetIds?: string[];
  }>,
) {
  try {
    const { widgets } = action.payload;
    console.log("#### there");
    const layoutSystemType: LayoutSystemTypes =
      yield select(getLayoutSystemType);
    if (layoutSystemType !== LayoutSystemTypes.ANVIL || !widgets) {
      yield put(updateAndSaveLayout(widgets));
    }

    let updatedWidgets: CanvasWidgetsReduxState = { ...widgets };

    /**
     * Extract all section widgets
     */
    const sections: FlattenedWidgetProps[] = Object.values(widgets).filter(
      (each: FlattenedWidgetProps) => each.type === SectionWidget.type,
    );

    for (const each of sections) {
      const children: string[] | undefined = each.children;
      /**
       * If a section doesn't have any children,
       * => delete it.
       */
      if (!children || !children?.length) {
        let parent: FlattenedWidgetProps =
          updatedWidgets[each.parentId || MAIN_CONTAINER_WIDGET_ID];
        if (parent) {
          parent = {
            ...parent,
            children: parent.children?.filter(
              (id: string) => id !== each.widgetId,
            ),
          };
          delete updatedWidgets[each.widgetId];
          updatedWidgets = updateAnvilParentPostWidgetDeletion(
            { ...updatedWidgets, [parent.widgetId]: parent },
            parent.widgetId,
            each.widgetId,
            each.type,
          );
        }
      } else if (each.zoneCount !== each.children?.length) {
        /**
         * If section's zone count doesn't match it's child count,
         * => update the zone count.
         */
        updatedWidgets = {
          ...updatedWidgets,
          [each.widgetId]: {
            ...each,
            zoneCount: each.children?.length,
          },
        };
      }
    }
    yield put(updateAndSaveLayout(updatedWidgets));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
        error,
      },
    });
  }
}

export function* performAnvilChecksSaga(
  action: ReduxAction<{
    updates: CrudWidgetsPayload;
  }>,
) {
  try {
    const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const { updates } = action.payload;
    console.log("#### pre performAnvilChecks", { updates, action });
    const { add, remove, update }: CrudWidgetsPayload = updates;
    console.log("#### performAnvilChecks", { add, remove, update });
    let newUpdates: UpdateWidgetsPayload = { ...update };
    let newRemove: string[] = [...(remove ?? [])];
    /**
     * Section checks
     */
    if (update && Object.keys(update).length) {
      for (const each of Object.keys(update)) {
        const widget: FlattenedWidgetProps = widgets[each];
        if (widget.type === SectionWidget.type) {
          const data = performSectionChecks(
            widgets,
            each,
            newUpdates,
            newRemove,
          );
          newUpdates = data.update;
          newRemove = data.remove;
        }
      }
    }
    console.log("#### post performAnvilChecks", {
      add,
      remove: newRemove,
      update: newUpdates,
    });
    yield put(
      crudMultipleWidgets({ add, remove: newRemove, update: newUpdates }),
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.PERFORM_ANVIL_CHECKS_BEFORE_UPDATE,
        error,
      },
    });
  }
}

function performSectionChecks(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  update: UpdateWidgetsPayload,
  remove: string[],
): { update: UpdateWidgetsPayload; remove: string[] } {
  const widget: FlattenedWidgetProps = widgets[widgetId];
  let children: string[] = widget.children || [];
  let zoneCount: number = widget.zoneCount;
  update[widgetId].forEach((eachUpdate) => {
    const { propertyPath, propertyValue } = eachUpdate;
    if (propertyPath === "zoneCount") {
      zoneCount = propertyValue as number;
    }
    if (propertyPath === "children") {
      children = propertyValue as string[];
    }
  });

  if (!children?.length) {
    /**
     * If a section doesn't have any children,
     * => delete it.
     */
    remove.push(widgetId);
    delete update[widgetId];
    if (widget.parentId && widgets[widget.parentId]) {
      const parentUpdates: UpdateWidgetsPayload =
        getParentUpdatesPostWidgetDeletion(
          widgets,
          widget.parentId,
          widgetId,
          widget.type,
        );
      update[widget.parentId] = [
        ...update[widget.parentId],
        ...parentUpdates[widget.parentId],
      ];
    }
  } else if (children.length !== zoneCount) {
    /**
     * If section's zone count doesn't match it's child count,
     * => update the zone count.
     */
    update[widgetId].push({
      propertyPath: "zoneCount",
      propertyValue: children.length,
    });
  }
  return { update, remove };
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(AnvilReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
      addSuggestedWidgetsAnvilSaga,
    ),
    takeLatest(
      AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
      updateAndSaveAnvilLayoutSaga,
    ),
    takeLatest(
      AnvilReduxActionTypes.PERFORM_ANVIL_CHECKS_BEFORE_UPDATE,
      performAnvilChecksSaga,
    ),
    takeLatest(
      ReduxActionTypes.CRUD_MULTIPLE_WIDGETS_AND_PROPERTIES,
      callEvalWithoutReplay,
    ),
  ]);
}
