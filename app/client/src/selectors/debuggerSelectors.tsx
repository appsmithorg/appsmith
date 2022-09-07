import { matchDatasourcePath } from "constants/routes";
import { Log } from "entities/AppsmithConsole";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { isEmpty } from "lodash";
import { AppState } from "reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { isWidget } from "workers/evaluationUtils";
import { getDataTree } from "./dataTreeSelectors";

type ErrorObejct = {
  [k: string]: Log;
};

export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
const emptyErrorObejct: ErrorObejct = {};

export const getFilteredErrors = createSelector(
  getDebuggerErrors,
  hideErrors,
  getWidgets,
  getDataTree,
  (errors, hideErrors, canvasWidgets, dataTree: DataTree) => {
    if (hideErrors) return emptyErrorObejct;
    if (isEmpty(errors)) return emptyErrorObejct;

    const alwaysShowEntities: Record<string, boolean> = {};
    Object.entries(errors).forEach(([, error]) => {
      const entity = error?.source?.name && dataTree[error.source.name];
      if (
        entity &&
        isWidget(entity) &&
        error.source?.propertyPath === "isVisible"
      ) {
        alwaysShowEntities[error.source.id] = true;
      }
    });
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([, error]) => {
        const entity = error?.source?.name && dataTree[error.source.name];
        // filter error - when widget or parent widget is hidden
        // parent widgets e.g. modal, tab, container
        if (entity && isWidget(entity)) {
          if (!hasParentWidget(entity)) {
            return entity.isVisible
              ? true
              : alwaysShowEntities[entity.widgetId];
          } else {
            const isParentWidgetVisible = isParentVisible(
              entity,
              canvasWidgets,
              dataTree,
            );
            return entity.isVisible
              ? isParentWidgetVisible
              : isParentWidgetVisible && alwaysShowEntities[entity.widgetId];
          }
        }
        return true;
      }),
    );
    return filteredErrors;
  },
);

export const isParentVisible = (
  currentWidgetData: DataTreeWidget,
  canvasWidgets: CanvasWidgetsReduxState,
  dataTree: DataTree,
): boolean => {
  const isWidgetVisible = !!currentWidgetData.isVisible;
  if (!hasParentWidget(currentWidgetData)) {
    return isWidgetVisible;
  }
  const parentWidget = canvasWidgets[currentWidgetData.parentId as string];
  if (!parentWidget) return isWidgetVisible;

  const parentWidgetData = dataTree[parentWidget.widgetName] as DataTreeWidget;
  if (!parentWidgetData) return isWidgetVisible;

  switch (parentWidgetData.type) {
    // check for widget types instead of harcoded string
    case "TABS_WIDGET":
      // need type for selectedTab and tabName
      const isTabContentVisible =
        !!parentWidgetData.isVisible &&
        parentWidgetData.selectedTab === currentWidgetData.tabName;
      return isTabContentVisible
        ? isParentVisible(parentWidgetData, canvasWidgets, dataTree)
        : false;
    case "MODAL_WIDGET":
      return !!parentWidgetData.isVisible;
    default:
      return parentWidgetData.isVisible
        ? isParentVisible(parentWidgetData, canvasWidgets, dataTree)
        : false;
  }
};

export const hasParentWidget = (widget: DataTreeWidget) =>
  widget.parentId && widget.parentId !== "0";

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
