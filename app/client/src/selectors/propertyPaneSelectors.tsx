import type { AppState } from "ee/reducers";
import { find, get, set } from "lodash";
import { createSelector } from "reselect";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type {
  PropertyPaneReduxState,
  SelectedPropertyPanel,
} from "reducers/uiReducers/propertyPaneReducer";
import { getWidgets } from "sagas/selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  EVALUATION_PATH,
  isPathDynamicProperty,
  isPathDynamicTrigger,
} from "utils/DynamicBindingUtils";
import { generateClassName } from "utils/generators";
import { getGoogleMapsApiKey } from "ee/selectors/tenantSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import { getLastSelectedWidget, getSelectedWidgets } from "./ui";
import { getLayoutSystemType } from "./layoutSystemSelectors";
import { getRenderMode } from "./editorSelectors";
import { RenderModes } from "constants/WidgetConstants";

export type WidgetProperties = WidgetProps & {
  [EVALUATION_PATH]?: DataTreeEntity;
};

export const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

export const getSelectedPropertyPanel = (state: AppState) =>
  state.ui.propertyPane.selectedPropertyPanel;

export const getCurrentWidgetId = createSelector(
  getSelectedWidgets,
  (widgetIds: string[]) => widgetIds[0],
);

const getRecentlyAddedWidgets = (state: AppState) =>
  state.ui.canvasSelection.recentlyAddedWidget;

export const getIsCurrentWidgetRecentlyAdded = createSelector(
  getCurrentWidgetId,
  getRecentlyAddedWidgets,
  (currentWidgetId, recentlyAddedWidgets) => {
    return currentWidgetId in recentlyAddedWidgets;
  },
);

export const getCurrentWidgetProperties = createSelector(
  getCanvasWidgets,
  getSelectedWidgets,
  (
    widgets: CanvasWidgetsReduxState,
    selectedWidgetIds: string[],
  ): WidgetProps | undefined => {
    return get(widgets, `${selectedWidgetIds[0]}`);
  },
);

const getCurrentWidgetName = createSelector(
  getCurrentWidgetProperties,
  (widget) => {
    return get(widget, "widgetName");
  },
);

export const getWidgetPropsForPropertyPane = createSelector(
  getCurrentWidgetProperties,
  getLayoutSystemType,
  (state) => {
    const currentWidget = getCurrentWidgetProperties(state);

    if (!currentWidget) return;

    const evaluatedWidget = find(getDataTree(state), {
      widgetId: currentWidget.widgetId,
    }) as WidgetEntity;

    if (!evaluatedWidget) return;

    return evaluatedWidget[EVALUATION_PATH];
  },
  (
    widget: WidgetProps | undefined,
    layoutSystemType,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluatedValue: any,
  ): WidgetProps | undefined => {
    if (!widget) return undefined;

    const widgetProperties = {
      ...widget,
      layoutSystemType,
    };

    if (evaluatedValue) {
      widgetProperties[EVALUATION_PATH] = evaluatedValue;
    }

    return widgetProperties;
  },
);

export const isWidgetSelectedForPropertyPane = createSelector(
  getWidgetPropsForPropertyPane,
  getRenderMode,
  (_state: AppState, widgetId: string) => widgetId,
  (widget: WidgetProps | undefined, renderMode: RenderModes, widgetId) => {
    return renderMode === RenderModes.CANVAS && widget?.widgetId === widgetId;
  },
);

export const selectedWidgetsPresentInCanvas = createSelector(
  getWidgets,
  getSelectedWidgets,
  (canvasWidgets, selectedWidgets) => {
    const widgets = [];

    for (const widget of selectedWidgets) {
      if (widget in canvasWidgets) widgets.push(widget);
    }

    return widgets;
  },
);

const populateWidgetProperties = (
  widget: WidgetProps | undefined,
  propertyPath: string,
  dependencies: string[],
  dynamicDependencies?: (widget: WidgetProps) => string[],
) => {
  if (widget && typeof dynamicDependencies === "function") {
    dependencies = [...dependencies, ...dynamicDependencies(widget)];
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetProperties: any = {};

  if (!widget) return widgetProperties;

  widgetProperties.type = widget.type;
  widgetProperties.widgetName = widget.widgetName;
  widgetProperties.widgetId = widget.widgetId;
  widgetProperties.isPropertyDynamicTrigger = isPathDynamicTrigger(
    widget,
    propertyPath,
  );
  widgetProperties.isPropertyDynamicPath = isPathDynamicProperty(
    widget,
    propertyPath,
  );

  getAndSetPath(widget, widgetProperties, propertyPath);

  if (dependencies && dependencies.length > 0) {
    for (const dependentProperty of dependencies) {
      widgetProperties[dependentProperty] = widget[dependentProperty];
    }
  }

  return widgetProperties;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAndSetPath = (from: any, to: any, path: string) => {
  if (!from || !to) return;

  const value = get(from, path);

  if (value === null || value === undefined) return;

  set(to, path, value);
};

const populateEvaluatedWidgetProperties = (
  evaluatedWidget: WidgetEntity,
  propertyPath: string,
  evaluatedDependencies: string[] = [],
) => {
  if (!evaluatedWidget || !evaluatedWidget[EVALUATION_PATH]) return;

  const evaluatedWidgetPath = evaluatedWidget[EVALUATION_PATH];

  const evaluatedProperties = {
    errors: {},
    evaluatedValues: {},
  };

  [propertyPath, ...evaluatedDependencies].forEach((path) => {
    getAndSetPath(
      evaluatedWidgetPath?.errors,
      evaluatedProperties.errors,
      path,
    );
    getAndSetPath(evaluatedWidget, evaluatedProperties.evaluatedValues, path);
  });

  return evaluatedProperties;
};

const getCurrentEvaluatedWidget = createSelector(
  getCurrentWidgetProperties,
  getDataTree,
  (widget: WidgetProps | undefined, evaluatedTree: DataTree): WidgetEntity => {
    return (
      widget?.widgetName ? evaluatedTree[widget.widgetName] : {}
    ) as WidgetEntity;
  },
);

export const getWidgetPropsForPropertyName = (
  propertyName: string,
  dependencies: string[] = [],
  evaluatedDependencies: string[] = [],
  dynamicDependencies?: (widget: WidgetProps) => string[],
) => {
  return createSelector(
    getCurrentWidgetProperties,
    getCurrentEvaluatedWidget,
    getGoogleMapsApiKey,
    (
      widget: WidgetProps | undefined,
      evaluatedWidget: WidgetEntity,
      googleMapsApiKey?: string,
    ): WidgetProperties => {
      const widgetProperties = populateWidgetProperties(
        widget,
        propertyName,
        dependencies,
        dynamicDependencies,
      );

      // if the widget has a googleMapsApiKey dependency, add it to the widget properties
      if (dependencies.includes("googleMapsApiKey")) {
        widgetProperties.googleMapsApiKey = googleMapsApiKey;
      }

      widgetProperties[EVALUATION_PATH] = populateEvaluatedWidgetProperties(
        evaluatedWidget,
        propertyName,
        evaluatedDependencies,
      );

      return widgetProperties;
    },
  );
};

const isResizingorDragging = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  isResizingorDragging,
  getLastSelectedWidget,
  getSelectedWidgets,
  (
    pane: PropertyPaneReduxState,
    isResizingorDragging: boolean,
    lastSelectedWidget,
    widgets,
  ) => {
    const el = document.getElementsByClassName(
      generateClassName(pane.widgetId),
    )[0];
    const isWidgetSelected: boolean = pane.widgetId
      ? lastSelectedWidget === pane.widgetId || widgets.includes(pane.widgetId)
      : false;
    const multipleWidgetsSelected = !!(widgets && widgets.length >= 2);

    return !!(
      isWidgetSelected &&
      !multipleWidgetsSelected &&
      !isResizingorDragging &&
      pane.isVisible &&
      el &&
      pane.widgetId
    );
  },
);

/**
 * returns the width of propertypane
 *
 * @param state
 * @returns
 */
export const getPropertyPaneWidth = (state: AppState) => {
  return state.ui.propertyPane.width;
};

export const getFocusablePropertyPaneField = (state: AppState) =>
  state.ui.propertyPane.focusedProperty;

export const getShouldFocusPropertyPath = createSelector(
  [
    getFocusablePropertyPaneField,
    (_state: AppState, key: string | undefined) => key,
  ],
  (focusableField: string | undefined, key: string | undefined): boolean => {
    return !!(key && focusableField === key);
  },
);

export const getSelectedPropertyPanelIndex = createSelector(
  [
    getSelectedPropertyPanel,
    (_state: AppState, path: string | undefined) => path,
  ],
  (
    selectedPropertyPanel: SelectedPropertyPanel,
    path: string | undefined,
  ): number | undefined => {
    if (!path || selectedPropertyPanel[path] === undefined) return;

    return selectedPropertyPanel[path];
  },
);

export const getShouldFocusPropertySearch = createSelector(
  getIsCurrentWidgetRecentlyAdded,
  getFocusablePropertyPaneField,
  (
    isCurrentWidgetRecentlyAdded: boolean,
    focusableField: string | undefined,
  ) => {
    return !isCurrentWidgetRecentlyAdded && !focusableField;
  },
);

export const getShouldFocusPanelPropertySearch = createSelector(
  getSelectedPropertyPanel,
  getCurrentWidgetName,
  (propertyPanel, widgetName) => {
    if (!widgetName) return false;

    return Object.keys(propertyPanel)
      .map((x) => x.split(".")[0])
      .includes(widgetName);
  },
);
