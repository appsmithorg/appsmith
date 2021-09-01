import { AppState } from "reducers";
import { createSelector } from "reselect";

import { TableFilterPaneReduxState } from "reducers/uiReducers/tableFilterPaneReducer";
import { getSelectedWidget, getSelectedWidgets } from "./ui";

export const getTableFilterState = (
  state: AppState,
): TableFilterPaneReduxState => state.ui.tableFilterPane;

const isResizingorDragging = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsTableFilterPaneVisible = createSelector(
  getTableFilterState,
  isResizingorDragging,
  getSelectedWidget,
  getSelectedWidgets,
  (
    pane: TableFilterPaneReduxState,
    isResizingorDragging: boolean,
    lastSelectedWidget,
    widgets,
  ) => {
    const isWidgetSelected = pane?.widgetId
      ? lastSelectedWidget === pane.widgetId || widgets.includes(pane.widgetId)
      : false;
    const multipleWidgetsSelected = !!(widgets && widgets.length >= 2);
    return !!(
      isWidgetSelected &&
      !multipleWidgetsSelected &&
      !isResizingorDragging &&
      pane.isVisible &&
      pane.widgetId
    );
  },
);
