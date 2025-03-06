import type { Log } from "entities/AppsmithConsole";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import type { AppState } from "ee/reducers";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import {
  isWidget,
  shouldSuppressDebuggerError,
} from "ee/workers/Evaluation/evaluationUtils";
import { getDataTree } from "./dataTreeSelectors";
import type { CanvasDebuggerState } from "reducers/uiReducers/debuggerReducer";
import { selectCombinedPreviewMode } from "./gitModSelectors";

interface ErrorObject {
  [k: string]: Log;
}

export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
const emptyErrorObject: ErrorObject = {};

export const getFilteredErrors = createSelector(
  getDebuggerErrors,
  hideErrors,
  getWidgets,
  getDataTree,
  (errors, hideErrors, canvasWidgets, dataTree: DataTree) => {
    if (hideErrors) return emptyErrorObject;

    if (isEmpty(errors)) return emptyErrorObject;

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
          const widgetEntity = entity as WidgetEntity;

          if (shouldSuppressDebuggerError(widgetEntity)) {
            return false;
          }

          if (!hasParentWidget(widgetEntity)) {
            return widgetEntity.isVisible
              ? true
              : alwaysShowEntities[widgetEntity.widgetId];
          } else {
            const isParentWidgetVisible = isParentVisible(
              widgetEntity,
              canvasWidgets,
              dataTree,
            );

            return widgetEntity.isVisible
              ? isParentWidgetVisible
              : isParentWidgetVisible &&
                  alwaysShowEntities[widgetEntity.widgetId];
          }
        }

        return true;
      }),
    );

    return filteredErrors;
  },
);

export const isParentVisible = (
  currentWidgetData: WidgetEntity,
  canvasWidgets: CanvasWidgetsReduxState,
  dataTree: DataTree,
): boolean => {
  const isWidgetVisible = !!currentWidgetData.isVisible;

  if (!hasParentWidget(currentWidgetData)) {
    return isWidgetVisible;
  }

  const parentWidget = canvasWidgets[currentWidgetData.parentId as string];

  if (!parentWidget) return isWidgetVisible;

  const parentWidgetData = dataTree[parentWidget.widgetName] as WidgetEntity;

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

export const hasParentWidget = (widget: WidgetEntity) =>
  widget.parentId && widget.parentId !== "0";

export const getMessageCount = createSelector(getFilteredErrors, (errors) => {
  let errorsCount = 0;

  // count number of messages in each error.
  // This logic is required because each messages in error is rendered separately.
  Object.values(errors).forEach((error) => {
    if (error.messages) {
      errorsCount += error.messages.length;
    }
  });
  // count number of warnings.
  const warningsCount = Object.keys(errors).filter((key: string) =>
    key.includes("warning"),
  ).length;

  errorsCount = errorsCount - warningsCount;

  return { errors: errorsCount, warnings: warningsCount };
});

// get selected tab in debugger.
export const getDebuggerSelectedTab = (state: AppState) =>
  state.ui.debugger.context.selectedDebuggerTab;

export const getDebuggerSelectedFilter = (state: AppState) =>
  state.ui.debugger.context.selectedDebuggerFilter;

export const getResponsePaneHeight = (state: AppState) =>
  state.ui.debugger.context.responseTabHeight;

export const getErrorCount = (state: AppState) =>
  state.ui.debugger.context.errorCount;

export const getScrollPosition = (state: AppState) =>
  state.ui.debugger.context.scrollPosition;

export const getDebuggerContext = (state: AppState) =>
  state.ui.debugger.context;

export const getDebuggerOpen = (state: AppState) => state.ui.debugger.isOpen;

export const showDebuggerFlag = createSelector(
  getDebuggerOpen,
  selectCombinedPreviewMode,
  (isOpen, isPreview) => isOpen && !isPreview,
);

export const getCanvasDebuggerState = createSelector(
  showDebuggerFlag,
  getDebuggerContext,
  (openState, context): CanvasDebuggerState => {
    return {
      open: openState,
      selectedTab: context.selectedDebuggerTab,
      responseTabHeight: context.responseTabHeight,
    };
  },
);
