import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";

import type { TableFilterPaneReduxState } from "reducers/uiReducers/tableFilterPaneReducer";
import { getLastSelectedWidget, getSelectedWidgets } from "./ui";

export const getTableFilterState = (
  state: DefaultRootState,
): TableFilterPaneReduxState => state.ui.tableFilterPane;

const isResizingorDragging = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsTableFilterPaneVisible = createSelector(
  getTableFilterState,
  isResizingorDragging,
  getLastSelectedWidget,
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
