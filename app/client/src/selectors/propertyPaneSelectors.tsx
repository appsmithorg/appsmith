import { find, get, pick, set } from "lodash";
import { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "./entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  DataTree,
  DataTreeEntity,
  DataTreeWidget,
} from "entities/DataTree/dataTreeFactory";
import {
  PropertyPaneReduxState,
  SelectedPropertyPanel,
} from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getLastSelectedWidget, getSelectedWidgets } from "./ui";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import { generateClassName } from "utils/generators";
import { getWidgets } from "sagas/selectors";
import { RegisteredWidgetFeatures } from "utils/WidgetFeatures";

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
  getDataTree,
  (
    widget: WidgetProps | undefined,
    evaluatedTree: DataTree,
  ): WidgetProps | undefined => {
    if (!widget) return undefined;
    const evaluatedWidget = find(evaluatedTree, {
      widgetId: widget.widgetId,
    }) as DataTreeWidget;
    const widgetProperties = { ...widget };

    if (evaluatedWidget) {
      widgetProperties[EVALUATION_PATH] = evaluatedWidget[EVALUATION_PATH];
    }
    return widgetProperties;
  },
);

type WidgetPropertiesForPropertyPaneView = {
  disabledWidgetFeatures?: RegisteredWidgetFeatures[];
  type: string;
  widgetId: string;
  widgetName: string;
  displayName: string;
};

export const getWidgetPropsForPropertyPaneView = createSelector(
  getWidgetPropsForPropertyPane,
  (props) =>
    pick(props, [
      "type",
      "widgetId",
      "widgetName",
      "displayName",
      "disabledWidgetFeatures",
    ]) as WidgetPropertiesForPropertyPaneView,
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
) => {
  const widgetProperties: any = {};

  if (!widget) return widgetProperties;

  widgetProperties.type = widget.type;
  widgetProperties.widgetName = widget.widgetName;
  widgetProperties.widgetId = widget.widgetId;
  widgetProperties.dynamicTriggerPathList = widget.dynamicTriggerPathList;
  widgetProperties.dynamicPropertyPathList = widget.dynamicPropertyPathList;

  getAndSetPath(widget, widgetProperties, propertyPath);

  if (dependencies && dependencies.length > 0) {
    for (const dependentProperty of dependencies) {
      widgetProperties[dependentProperty] = widget[dependentProperty];
    }
  }

  return widgetProperties;
};

const getAndSetPath = (from: any, to: any, path: string) => {
  if (!from || !to) return;

  const value = get(from, path);

  if (value === null || value === undefined) return;

  set(to, path, value);
};

const populateEvaluatedWidgetProperties = (
  evaluatedWidget: DataTreeWidget,
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
    getAndSetPath(
      evaluatedWidgetPath?.evaluatedValues,
      evaluatedProperties.evaluatedValues,
      path,
    );
  });

  return evaluatedProperties;
};

const getCurrentEvaluatedWidget = createSelector(
  getCurrentWidgetProperties,
  getDataTree,
  (
    widget: WidgetProps | undefined,
    evaluatedTree: DataTree,
  ): DataTreeWidget => {
    return (widget?.widgetName
      ? evaluatedTree[widget.widgetName]
      : {}) as DataTreeWidget;
  },
);

export const getWidgetPropsForPropertyName = (
  propertyName: string,
  dependencies: string[] = [],
  evaluatedDependencies: string[] = [],
) => {
  return createSelector(
    getCurrentWidgetProperties,
    getCurrentEvaluatedWidget,
    (
      widget: WidgetProps | undefined,
      evaluatedWidget: DataTreeWidget,
    ): WidgetProperties => {
      const widgetProperties = populateWidgetProperties(
        widget,
        propertyName,
        dependencies,
      );

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
    const isWidgetSelected = pane.widgetId
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
