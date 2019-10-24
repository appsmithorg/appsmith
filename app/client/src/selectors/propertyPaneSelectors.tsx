import { createSelector } from "reselect";
import { AppState } from "../reducers";
import { PropertyPaneReduxState } from "../reducers/uiReducers/propertyPaneReducer";
import { PropertyPaneConfigState } from "../reducers/entityReducers/propertyPaneConfigReducer";
import { CanvasWidgetsReduxState } from "../reducers/entityReducers/canvasWidgetsReducer";

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
  (widgets: CanvasWidgetsReduxState, pane: PropertyPaneReduxState) => {
    return pane.widgetId && widgets ? widgets[pane.widgetId] : undefined;
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
    if (pane.widgetId && configs && widgets[pane.widgetId]) {
      return configs.config[widgets[pane.widgetId].type];
    }
    return undefined;
  },
);

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  (pane: PropertyPaneReduxState) => pane.isVisible,
);
