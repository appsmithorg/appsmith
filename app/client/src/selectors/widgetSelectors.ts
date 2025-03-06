import { createSelector } from "reselect";
import type { AppState } from "ee/reducers";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { getExistingWidgetNames } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

import WidgetFactory from "WidgetProvider/factory";
import {
  getAltBlockWidgetSelection,
  getFocusedWidget,
  getLastSelectedWidget,
  getSelectedWidgets,
} from "./ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { get } from "lodash";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { getIsAutoHeightWithLimitsChanging } from "utils/hooks/autoHeightUIHooks";
import { getIsPropertyPaneVisible } from "./propertyPaneSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { selectCombinedPreviewMode } from "./gitModSelectors";

export const getIsDraggingOrResizing = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsResizing = (state: AppState) =>
  state.ui.widgetDragResize.isResizing;

const getCanvasWidgets = (state: AppState) => state.entities.canvasWidgets;

// A selector that gets the modal widget type based on the feature flag
// This will need to be updated once Anvil and WDS are generally available
export const getModalWidgetType = createSelector(
  getIsAnvilLayout,
  (isAnvilLayout: boolean) => {
    let modalWidgetType = "MODAL_WIDGET";

    if (isAnvilLayout) {
      modalWidgetType = "WDS_MODAL_WIDGET";
    }

    return modalWidgetType;
  },
);

export const getModalWidgets = createSelector(
  getCanvasWidgets,
  getModalWidgetType,
  (widgets, modalWidgetType) => {
    const modalWidgets = Object.values(widgets).filter(
      (widget: FlattenedWidgetProps) => widget.type === modalWidgetType,
    );

    if (modalWidgets.length === 0) return undefined;

    return modalWidgets;
  },
);

export const getModalDropdownList = createSelector(
  getModalWidgets,
  (modalWidgets) => {
    if (!modalWidgets) return undefined;

    return modalWidgets.map((widget: FlattenedWidgetProps) => ({
      id: widget.widgetId,
      label: widget.widgetName,
      value: `${widget.widgetName}.name`,
    }));
  },
);

export const getNextModalName = createSelector(
  getExistingWidgetNames,
  getModalWidgetType,
  (names, modalWidgetType) => {
    const prefix =
      WidgetFactory.widgetConfigMap.get(modalWidgetType)?.widgetName || "";

    return getNextEntityName(prefix, names);
  },
);

/**
 * Selector to get the parent widget of a particaular widget with id as a prop
 */
export const getParentWidget = createSelector(
  getCanvasWidgets,
  (state: AppState, widgetId: string) => widgetId,
  (canvasWidgets, widgetId: string): FlattenedWidgetProps | undefined => {
    if (canvasWidgets.hasOwnProperty(widgetId)) {
      const widget = canvasWidgets[widgetId];

      if (widget.parentId && canvasWidgets.hasOwnProperty(widget.parentId)) {
        const parent = canvasWidgets[widget.parentId];

        return parent;
      }
    }

    return;
  },
);

export const getFocusedParentToOpen = createSelector(
  getCanvasWidgets,
  (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  (canvasWidgets, focusedWidgetId) => {
    return getParentToOpenIfAny(focusedWidgetId, canvasWidgets);
  },
);

export const getParentToOpenSelector = (widgetId: string) => {
  return createSelector(getCanvasWidgets, (canvasWidgets) => {
    return getParentToOpenIfAny(widgetId, canvasWidgets);
  });
};

// Check if widget is in the list of selected widgets
export const isWidgetSelected = (widgetId?: string) => {
  return createSelector(getSelectedWidgets, (widgets): boolean =>
    widgetId ? widgets.includes(widgetId) : false,
  );
};

export const isWidgetFocused = (widgetId: string) => {
  return createSelector(
    getFocusedWidget,
    (widget): boolean => widget === widgetId,
  );
};

// Check if current widget is the last selected widget
export const isCurrentWidgetLastSelected = (widgetId: string) => {
  return createSelector(
    getLastSelectedWidget,
    (widget): boolean => widget === widgetId,
  );
};

// Check if current widget is one of multiple selected widgets
export const isMultiSelectedWidget = (widgetId: string) => {
  return createSelector(
    getSelectedWidgets,
    (widgets): boolean => widgets.length > 1 && widgets.includes(widgetId),
  );
};

export function getParentToOpenIfAny(
  widgetId: string | undefined,
  widgets: CanvasWidgetsReduxState,
) {
  if (widgetId) {
    let widget = get(widgets, widgetId, undefined);

    // While this widget has a openParentPropertyPane equal to true
    while (widget?.openParentPropertyPane) {
      // Get parent widget props
      const parent = get(widgets, `${widget.parentId}`, undefined);

      // If parent has openParentPropertyPane = false, return the current parent
      if (!parent?.openParentPropertyPane) {
        return parent;
      }

      if (parent?.parentId && parent.parentId !== MAIN_CONTAINER_WIDGET_ID) {
        widget = get(widgets, `${widget.parentId}`, undefined);

        continue;
      }
    }
  }

  return;
}

export const shouldWidgetIgnoreClicksSelector = (widgetId: string) => {
  return createSelector(
    getFocusedWidget,
    getIsTableFilterPaneVisible,
    (state: AppState) => state.ui.widgetDragResize.isResizing,
    (state: AppState) => state.ui.widgetDragResize.isDragging,
    (state: AppState) => state.ui.canvasSelection.isDraggingForSelection,
    getAppMode,
    selectCombinedPreviewMode,
    getIsAutoHeightWithLimitsChanging,
    getAltBlockWidgetSelection,
    (
      focusedWidgetId,
      isTableFilterPaneVisible,
      isResizing,
      isDragging,
      isDraggingForSelection,
      appMode,
      isPreviewMode,
      isAutoHeightWithLimitsChanging,
      isWidgetSelectionBlock,
    ) => {
      const isFocused = focusedWidgetId === widgetId;

      return (
        isDraggingForSelection ||
        isResizing ||
        isDragging ||
        isPreviewMode ||
        appMode !== APP_MODE.EDIT ||
        !isFocused ||
        isTableFilterPaneVisible ||
        isAutoHeightWithLimitsChanging ||
        isWidgetSelectionBlock
      );
    },
  );
};

export const getSelectedWidgetAncestry = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidgetAncestry;

export const getEntityExplorerWidgetAncestry = (state: AppState) =>
  state.ui.widgetDragResize.entityExplorerAncestry;

export const getEntityExplorerWidgetsToExpand = createSelector(
  getEntityExplorerWidgetAncestry,
  (selectedWidgetAncestry: string[]) => {
    return selectedWidgetAncestry.slice(1);
  },
);

export const showWidgetAsSelected = (widgetId: string) => {
  return createSelector(
    getLastSelectedWidget,
    getSelectedWidgets,
    (lastSelectedWidgetId, selectedWidgets) => {
      return (
        lastSelectedWidgetId === widgetId ||
        (selectedWidgets.length > 1 && selectedWidgets.includes(widgetId))
      );
    },
  );
};

export const getFirstSelectedWidgetInList = createSelector(
  getSelectedWidgets,
  (selectedWidgets) => {
    return selectedWidgets?.length ? selectedWidgets[0] : undefined;
  },
);

export const isCurrentWidgetActiveInPropertyPane = (widgetId: string) => {
  return createSelector(
    getIsPropertyPaneVisible,
    getFirstSelectedWidgetInList,
    (isPaneVisible, firstSelectedWidgetId) => {
      return isPaneVisible && firstSelectedWidgetId === widgetId;
    },
  );
};

export const isResizingOrDragging = createSelector(
  (state: AppState) => state.ui.widgetDragResize.isResizing,
  (state: AppState) => state.ui.widgetDragResize.isDragging,
  (isResizing, isDragging) => !!isResizing || !!isDragging,
);
