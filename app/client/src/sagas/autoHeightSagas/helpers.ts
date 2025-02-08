import type { AppState } from "ee/reducers";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import type { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getWidgetMetaProps, getWidgets } from "sagas/selectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import { getAppMode } from "ee/selectors/entitiesSelector";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import { getCanvasHeightOffset } from "utils/WidgetSizeUtils";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getDataTree } from "selectors/dataTreeSelectors";

export function* shouldWidgetsCollapse() {
  const isPreviewMode: boolean = yield select(selectCombinedPreviewMode);
  const appMode: APP_MODE = yield select(getAppMode);

  return isPreviewMode || appMode === APP_MODE.PUBLISHED;
}

export function* shouldAllInvisibleWidgetsInAutoHeightContainersCollapse() {
  const flag: boolean = yield select((state: AppState) => {
    return !!state.ui.applications.currentApplication?.collapseInvisibleWidgets;
  });

  return flag;
}

export function* getChildOfContainerLikeWidget(
  containerLikeWidget: FlattenedWidgetProps,
) {
  // Todo: Abstraction leak (abhinav): This is an abstraction leak
  // I don't have a better solution right now.
  // What we're trying to acheive is to skip the canvas which
  // is not currently visible in the tabs widget.
  if (containerLikeWidget.type === "TABS_WIDGET") {
    // Get the current tabs widget meta
    const tabsMeta: { selectedTabWidgetId: string } | undefined = yield select(
      getWidgetMetaProps,
      containerLikeWidget,
    );

    // If we have a meta for the tabs widget
    if (tabsMeta) return tabsMeta.selectedTabWidgetId;

    // If there are not meta values for the tabs widget
    // we get the first tab using the `index`
    const firstTab = Object.values(
      containerLikeWidget.tabsObj as Record<
        string,
        { widgetId: string; index: number }
      >,
    ).find((entry: { widgetId: string; index: number }) => entry.index === 0);

    return firstTab?.widgetId;
  } else if (Array.isArray(containerLikeWidget.children)) {
    // First child of a container like widget will be the canvas widget within in
    // Note: If we have this feature for List Widget, we will need to consider it.
    return containerLikeWidget.children[0];
  }
}

export function getParentCurrentHeightInRows(
  parentBottomRow: number,
  parentTopRow: number,
  parentId: string,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
) {
  // Get the parentHeight in rows
  let parentHeightInRows = parentBottomRow - parentTopRow;

  // If the parent has changed so far.
  if (changesSoFar.hasOwnProperty(parentId)) {
    parentHeightInRows =
      changesSoFar[parentId].bottomRow - changesSoFar[parentId].topRow;
  }

  return parentHeightInRows;
}

export function* getMinHeightBasedOnChildren(
  widgetId: string,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
  ignoreParent = false,
  tree: AutoHeightLayoutTreeReduxState,
) {
  // Starting with no height
  let minHeightInRows = 0;

  // Should we be able to collapse widgets
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  // Get all widgets in the DSL
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  // Skip this whole process if the parent is collapsed: Process:
  // Get the DataTree
  const dataTree: DataTree = yield select(getDataTree);

  const { children = [], parentId } = stateWidgets[widgetId];

  // If we need to consider the parent height
  if (parentId && !ignoreParent) {
    const parent = stateWidgets[parentId];
    // Get the node from the tree
    const parentTreeNode = tree[parentId];
    // Initialize from the parent state
    let parentBottomRow = parent.bottomRow;
    let parentTopRow = parent.topRow;

    // If the tree node exists use thata
    if (parentTreeNode !== undefined) {
      parentBottomRow = parentTreeNode.bottomRow;
      parentTopRow = parentTreeNode.topRow;
      // If this parent is detached from layout, use the height, or diff
      // in pixels to get bottom row in rows.
    } else if (parent.detachFromLayout) {
      parentBottomRow =
        parent.topRow +
        Math.ceil(
          (parent.height || parent.bottomRow - parent.topRow) /
            GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
    }

    const parentHeightInRows = getParentCurrentHeightInRows(
      parentBottomRow,
      parentTopRow,
      parentId,
      changesSoFar,
    );

    // The canvas will be an extension smaller than the parent?
    minHeightInRows = parentHeightInRows - GridDefaults.CANVAS_EXTENSION_OFFSET;

    // We will also remove any extra offsets the parent has
    // As we're dealing with the child canvas widget here.
    const canvasHeightOffset: number = getCanvasHeightOffset(
      parent.type,
      parent,
    );

    minHeightInRows = minHeightInRows - canvasHeightOffset;

    // If the canvas is empty return the parent's height in rows, without
    // the canvas extension offset
    if (!children.length) {
      return minHeightInRows;
    }
  }

  // For each child widget id.
  for (const childWidgetId of children) {
    // If we've changed the widget's bottomRow via computations
    const { detachFromLayout } = stateWidgets[childWidgetId];

    // We ignore widgets like ModalWidget which don't occupy parent's space.
    // detachFromLayout helps us identify such widgets
    if (detachFromLayout) continue;

    // Seems like sometimes, the children comes in as a string instead of string array.
    // I'm not completely sure why that is, or which widgets use "children" properties as strings
    // So, we're skipping computations for the children if such a thing happens.
    if (tree[childWidgetId] === undefined) continue;

    // Get this parentContainerWidget from the DataTree
    const dataTreeWidget = dataTree[stateWidgets[childWidgetId].widgetName];
    // If the widget exists, is not visible and we can collapse widgets

    if (
      dataTreeWidget &&
      (dataTreeWidget as WidgetEntity).isVisible !== true &&
      shouldCollapse
    ) {
      continue;
    }

    // Get the child widget's dimenstions from the tree
    const { bottomRow, topRow } = tree[childWidgetId];

    // If this child has changed so far during computations
    if (changesSoFar.hasOwnProperty(childWidgetId)) {
      const collapsing =
        changesSoFar[childWidgetId].bottomRow ===
        changesSoFar[childWidgetId].topRow;

      // If this child is collapsing, don't consider it
      if (!(shouldCollapse && collapsing))
        minHeightInRows = Math.max(
          minHeightInRows,
          changesSoFar[childWidgetId].bottomRow,
        );
      // If we need to get the existing bottomRow from the state
    } else {
      // If this child is to collapse, don't consider it.
      if (!(shouldCollapse && bottomRow === topRow))
        minHeightInRows = Math.max(minHeightInRows, bottomRow);
    }
  }

  if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
    return minHeightInRows + GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET;
  }

  return minHeightInRows;
}
/**
 * This function takes a widgetId and computes whether it can have zero height
 * Widget can have zero height if it has auto height enabled
 *
 *
 * Or if it is a child of a widget which has auto height enabled
 * (This is verified using shouldAllInvisibleWidgetsInAutoHeightContainersCollapse)
 *
 * @param stateWidgets The canvas widgets redux state needed for computations
 * @param widgetId The widget which is trying to collapse
 * @returns true if this widget can be collapsed to zero height
 */
export function* shouldCollapseThisWidget(
  stateWidgets: CanvasWidgetsReduxState,
  widgetId: string,
) {
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  const canCollapseAllWidgets: boolean =
    yield shouldAllInvisibleWidgetsInAutoHeightContainersCollapse();
  const widget = stateWidgets[widgetId];

  // If we're in preview or view mode
  if (shouldCollapse) {
    // If this widget has auto height enabled
    if (isAutoHeightEnabledForWidget(widget)) {
      return true;
    }

    // Get the parent Canvas widgetId
    const parentId = widget.parentId;

    if (parentId === MAIN_CONTAINER_WIDGET_ID && canCollapseAllWidgets) {
      return true;
    }

    // Get the grandparent or the parent container like widget
    const parentContainerLikeWidgetId = parentId
      ? stateWidgets[parentId].parentId
      : false;

    // If the parent container like widget exists
    if (parentContainerLikeWidgetId) {
      const parentContainerLikeWidget =
        stateWidgets[parentContainerLikeWidgetId];

      // If we can collapse widgets within all auto height container like widgets
      // and if the parent container like widget exists
      // and if auto height is enabled for the parent container
      // or if the parent is the main container
      if (
        parentContainerLikeWidget &&
        canCollapseAllWidgets &&
        isAutoHeightEnabledForWidget(parentContainerLikeWidget)
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * This function converts a standard object containing the properties to update
 * into the expected structure of { propertyPath: string, propertyValue: unknown }
 * @param originalObject The original object to mutate
 * @param widgetId The widgetId which will be the key in the object to mutate
 * @param propertiesToUpdate The properties which need to be added in the original object's widgetId key
 * @returns mutated object
 */
export function mutation_setPropertiesToUpdate(
  originalObject: Record<
    string,
    Array<{ propertyPath: string; propertyValue: unknown }>
  >,
  widgetId: string,
  propertiesToUpdate: Record<string, unknown>,
) {
  if (!originalObject.hasOwnProperty(widgetId)) {
    originalObject[widgetId] = [];
  }

  for (const [key, value] of Object.entries(propertiesToUpdate)) {
    originalObject[widgetId].push({
      propertyPath: key,
      propertyValue: value,
    });
  }

  return originalObject;
}
