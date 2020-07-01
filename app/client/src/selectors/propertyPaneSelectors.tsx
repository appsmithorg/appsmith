import { createSelector } from "reselect";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { PropertyPaneConfigState } from "reducers/entityReducers/propertyPaneConfigReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { evaluateDataTree } from "selectors/dataTreeSelectors";
import * as log from "loglevel";

const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

const getPropertyPaneConfig = (state: AppState): PropertyPaneConfigState =>
  state.entities.propertyConfig;

const getCanvasWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

export const getCurrentWidgetId = createSelector(
  getPropertyPaneState,
  (propertyPane: PropertyPaneReduxState) => propertyPane.widgetId,
);

export const getCurrentWidgetProperties = createSelector(
  getCanvasWidgets,
  getPropertyPaneState,
  (
    widgets: CanvasWidgetsReduxState,
    pane: PropertyPaneReduxState,
  ): WidgetProps | undefined => {
    return pane.widgetId && widgets ? widgets[pane.widgetId] : undefined;
  },
);

export const getWidgetPropsForPropertyPane = createSelector(
  getCurrentWidgetProperties,
  evaluateDataTree(false),
  (
    widget: WidgetProps | undefined,
    evaluatedTree: DataTree,
  ): WidgetProps | undefined => {
    log.debug("Evaluating data tree to get property pane validations");
    if (!widget) return undefined;
    const evaluatedWidget = _.find(evaluatedTree, {
      widgetId: widget.widgetId,
    }) as DataTreeWidget;
    const widgetProperties = {
      ...widget,
      evaluatedValues: { ...evaluatedWidget.evaluatedValues },
    };
    if (evaluatedWidget.invalidProps) {
      const { invalidProps, validationMessages } = evaluatedWidget;
      widgetProperties.invalidProps = invalidProps;
      widgetProperties.validationMessages = validationMessages;
    }
    return widgetProperties;
  },
);

export const getPropertyConfig = createSelector(
  getPropertyPaneConfig,
  getPropertyPaneState,
  getCanvasWidgets,
  (
    configs: PropertyPaneConfigState,
    pane: PropertyPaneReduxState,
    widgets: CanvasWidgetsReduxState,
  ) => {
    if (
      pane.widgetId &&
      configs &&
      !!configs.config &&
      widgets[pane.widgetId]
    ) {
      return configs.config[widgets[pane.widgetId].type];
    }
    return undefined;
  },
);

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  getPropertyConfig,
  (pane: PropertyPaneReduxState, content?: PropertySection[]) =>
    !!(pane.isVisible && pane.widgetId && content),
);
