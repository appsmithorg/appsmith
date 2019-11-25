import { createSelector } from "reselect";
import { AppState, DataTree } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { PropertyPaneConfigState } from "reducers/entityReducers/propertyPaneConfigReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import { getDataTree } from "./entitiesSelector";
import { enhanceWithDynamicValuesAndValidations } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";

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

export const getWidgetPropsWithValidations = createSelector(
  getCurrentWidgetProperties,
  getDataTree,
  (widget: WidgetProps | undefined, dataTree: DataTree) => {
    if (!widget) return undefined;
    return enhanceWithDynamicValuesAndValidations(widget, dataTree, false);
  },
);

export const getCurrentReferenceNode = createSelector(
  getPropertyPaneState,
  (pane: PropertyPaneReduxState) => {
    return pane.widgetId && pane.node ? pane.node : undefined;
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
    !!(pane.isVisible && pane.widgetId && pane.node && content),
);
