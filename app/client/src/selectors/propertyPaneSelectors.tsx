import { find, get } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { getDataTree } from "selectors/dataTreeSelectors";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { PropertyPaneEnhancementsReduxState } from "reducers/uiReducers/propertyPaneEnhancementsReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

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
    return get(widgets, `${pane.widgetId}`);
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

/**
 * return the redux state of enhancmentsMap
 *
 * @param state
 */
export const getEnhancementsMap = (state: AppState) =>
  state.ui.propertyPaneEnhancementsMap;

/**
 * returns the enchancments of current widget from widget config
 * enchancmentsMap is the object key-value pair of widgetId => widgetType
 *
 *  for e.g: { "mywidgetId": "LIST_WIDGET" }
 */
export const getPropertyPaneEnhancements = createSelector(
  getEnhancementsMap,
  getCurrentWidgetId,
  (enhancementsMap: PropertyPaneEnhancementsReduxState, widgetId?: string) => {
    // if there is no widget id ( that's means, no widget property pane is selected)
    if (!widgetId) return;

    const widgetType = get(enhancementsMap, `${widgetId}.type`);

    return get(
      WidgetConfigResponse,
      `config.${widgetType}.propertyPaneEnhancements`,
    );
  },
);
