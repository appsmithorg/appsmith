import { find, get, pick, set } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "./entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getSelectedWidget, getSelectedWidgets } from "./ui";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { generateClassName } from "utils/generators";
import { getWidgets } from "sagas/selectors";

export type WidgetProperties = WidgetProps & {
  [EVALUATION_PATH]?: DataTreeEntity;
};

export const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

export const getCurrentWidgetId = createSelector(
  getPropertyPaneState,
  (propertyPane: PropertyPaneReduxState) => propertyPane.widgetId,
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

export const getWidgetPropsForPropertyName = (
  propertyName: string,
  dependencies: string[] = [],
  evaluatedDependencies: string[] = [],
) => {
  return createSelector(
    getCurrentWidgetProperties,
    getDataTree,
    (
      widget: WidgetProps | undefined,
      evaluatedTree: DataTree,
    ): WidgetProperties => {
      const evaluatedWidget = find(evaluatedTree, {
        widgetId: widget?.widgetId,
      }) as DataTreeWidget;

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
  getSelectedWidget,
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
