import { APP_MODE } from "entities/App";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getWidgetMetaProps, getWidgets } from "sagas/selectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "selectors/entitiesSelector";
import { TreeNode } from "utils/autoHeight/constants";

export function* shouldWidgetsCollapse() {
  const isPreviewMode: boolean = yield select(previewModeSelector);
  const appMode: APP_MODE = yield select(getAppMode);

  return isPreviewMode || appMode === APP_MODE.PUBLISHED;
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
      containerLikeWidget.widgetId,
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

export function* getMinHeightBasedOnChildren(
  widgetId: string,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
) {
  let minHeightInRows = 0;
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  // TODO (abhinav): Implement this when the relevant code PR is merged.
  const autoHeightLayoutTree: Record<string, TreeNode> = {};

  const { children = [] } = stateWidgets[widgetId];
  // For each child widget id.
  for (const childWidgetId of children) {
    // If we've changed the widget's bottomRow via computations
    const { detachFromLayout } = stateWidgets[childWidgetId];
    // We ignore widgets like ModalWidget which don't occupy parent's space.
    // detachFromLayout helps us identify such widgets
    if (detachFromLayout) continue;
    const { bottomRow, topRow } = autoHeightLayoutTree[childWidgetId];

    if (changesSoFar.hasOwnProperty(childWidgetId)) {
      const collapsing =
        changesSoFar[childWidgetId].bottomRow ===
        changesSoFar[childWidgetId].topRow;

      if (!(shouldCollapse && collapsing))
        minHeightInRows = Math.max(
          minHeightInRows,
          changesSoFar[childWidgetId].bottomRow,
        );
      // If we need to get the existing bottomRow from the state
    } else {
      if (!(shouldCollapse && bottomRow === topRow))
        minHeightInRows = Math.max(minHeightInRows, bottomRow);
    }
  }
  return minHeightInRows;
}
