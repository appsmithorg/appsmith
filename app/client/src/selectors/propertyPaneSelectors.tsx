import { createSelector } from "reselect";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { PropertyPaneConfigState } from "reducers/entityReducers/propertyPaneConfigReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import {
  enhanceWidgetWithValidations,
  getEvaluatedDataTree,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import _ from "lodash";
import { DataTree } from "entities/DataTree/dataTreeFactory";

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
  getUnevaluatedDataTree,
  (widget: WidgetProps | undefined, nameBindingsWithData: DataTree) => {
    if (!widget) return undefined;
    const tree = getEvaluatedDataTree(nameBindingsWithData, false);
    const evaluatedWidget = _.find(tree, { widgetId: widget.widgetId });
    const validations = enhanceWidgetWithValidations(
      evaluatedWidget as WidgetProps,
    );
    if (validations) {
      const { invalidProps, validationMessages } = validations;
      return {
        ...widget,
        invalidProps,
        validationMessages,
      };
    }
    return widget;
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
