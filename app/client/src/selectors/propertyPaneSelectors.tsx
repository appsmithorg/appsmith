import { createSelector } from "reselect";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { find } from "lodash";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getCanvasWidgets } from "./entitiesSelector";

const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

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
      if (evaluatedWidget.evaluatedValues) {
        widgetProperties.evaluatedValues = {
          ...evaluatedWidget.evaluatedValues,
        };
      }
      if (evaluatedWidget.invalidProps) {
        const { invalidProps, validationMessages } = evaluatedWidget;
        widgetProperties.invalidProps = invalidProps;
        widgetProperties.validationMessages = validationMessages;
      }
    }
    return widgetProperties;
  },
);

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  (pane: PropertyPaneReduxState) => !!(pane.isVisible && pane.widgetId),
);
