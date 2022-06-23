import { matchDatasourcePath } from "constants/routes";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { AppState } from "reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { isWidget } from "workers/evaluationUtils";
import { getDataTree } from "./dataTreeSelectors";
export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
export const getFilteredErrors = createSelector(
  getDebuggerErrors,
  hideErrors,
  getWidgets,
  getDataTree,
  (errors, hideErrors, canvasWidgets, dataTree: DataTree) => {
    if (hideErrors) return {};

    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([, error]) => {
        const entity = error?.source?.name && dataTree[error.source.name];
        if (entity && isWidget(entity)) {
          // console.log("---------- my errors");
          return entity.isVisible
            ? isParentVisible(entity, canvasWidgets, dataTree)
            : false;
        }
        return true;
      }),
    );
    // console.log("--------------------- my errors", errors, filteredErrors);
    return filteredErrors;
  },
);

export const isParentVisible = (
  widgetData: DataTreeWidget,
  canvasWidgets: CanvasWidgetsReduxState,
  dataTree: DataTree,
): boolean => {
  const isWidgetVisible = !!widgetData.isVisible;
  if (!widgetData.parentId || widgetData.parentId === "0") {
    return isWidgetVisible;
  }
  const parentWidget = canvasWidgets[widgetData.parentId];
  if (!parentWidget) return isWidgetVisible;

  const parentWidgetData = dataTree[parentWidget.widgetName] as DataTreeWidget;
  if (!parentWidgetData) return isWidgetVisible;

  // console.log("my errors", widgetData, parentWidgetData);
  switch (parentWidgetData.type) {
    // check of types instead of harcoded string
    case "TABS_WIDGET":
      return parentWidgetData.selectedTab === widgetData.tabName;
    case "MODAL_WIDGET":
      return !!parentWidgetData.isVisible;
    default:
      return parentWidgetData.isVisible
        ? isParentVisible(parentWidgetData, canvasWidgets, dataTree)
        : false;
  }
};

export const getCurrentDebuggerTab = (state: AppState) =>
  state.ui.debugger.currentTab;

export const getMessageCount = createSelector(getFilteredErrors, (errors) => {
  const errorKeys = Object.keys(errors);
  const warningsCount = errorKeys.filter((key: string) =>
    key.includes("warning"),
  ).length;
  const errorsCount = errorKeys.length - warningsCount;
  return { errors: errorsCount, warnings: warningsCount };
});

export const hideDebuggerIconSelector = () =>
  matchDatasourcePath(window.location.pathname);
