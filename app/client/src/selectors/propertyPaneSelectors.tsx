import { createSelector } from "reselect";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { getDataTree } from "selectors/dataTreeSelectors";

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
    const evaluatedWidget = _.find(evaluatedTree, {
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

// export const getWidgetChildPropertiesForPropertyPane = createSelector(
//   getPropertyPaneState,
//   getCurrentWidgetProperties,
//   getDataTree,
//   (
//     pane: PropertyPaneReduxState,
//     widget: WidgetProps | undefined,
//     evaluatedTree: DataTree,
//   ): any | undefined => {
//     log.debug("Evaluating data tree to get child property pane validations");
//     if (!widget) return undefined;
//     const evaluatedWidget = _.find(evaluatedTree, {
//       widgetId: widget.widgetId,
//     }) as DataTreeWidget;
//     const widgetProperties = { ...widget };
//     let childProperties = undefined;
//     if (evaluatedWidget) {
//       if (evaluatedWidget.evaluatedValues) {
//         widgetProperties.evaluatedValues = {
//           ...evaluatedWidget.evaluatedValues,
//         };
//       }
//       if (evaluatedWidget.invalidProps) {
//         const { invalidProps, validationMessages } = evaluatedWidget;
//         widgetProperties.invalidProps = invalidProps;
//         widgetProperties.validationMessages = validationMessages;
//       }
//     }
//     if (pane.propertyControlId) {
//       const childItems = widgetProperties[pane.propertyControlId];
//       if (childItems && childItems.length) {
//         for (let i = 0; i < childItems.length; i++) {
//           if (childItems[i] && childItems[i].id === pane.widgetChildProperty) {
//             childProperties = childItems[i];
//           }
//         }
//       }
//     }
//     return childProperties;
//   },
// );
