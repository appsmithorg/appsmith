import { DataTree } from "reducers";
import { JSONPath } from "jsonpath-plus";
import { createSelector } from "reselect";
import { getDataTree } from "./entitiesSelector";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import * as _ from "lodash";
import { DerivedPropFactory } from "utils/DerivedPropertiesFactory";
import createCachedSelector from "re-reselect";

export type NameBindingsWithData = Record<string, object>;

export const getCanvasWidgets = createSelector(
  getDataTree,
  (dataTree: DataTree): CanvasWidgetsReduxState => {
    return dataTree.canvasWidgets;
  },
);

export const getNameBindingsWithData = createSelector(
  getDataTree,
  (dataTree: DataTree): NameBindingsWithData => {
    const nameBindingsWithData: Record<string, object> = {};
    Object.keys(dataTree.nameBindings).forEach(key => {
      const nameBindings = dataTree.nameBindings[key];
      const evaluatedValue = JSONPath({
        path: nameBindings,
        json: dataTree,
      })[0];
      if (evaluatedValue && key !== "undefined") {
        nameBindingsWithData[key] = evaluatedValue;
      }
    });
    return nameBindingsWithData;
  },
);

const getCanvasWidgetData = (
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
) => {
  return canvasWidgets[widgetId];
};

const getDerivedPropertiesForWidget = createCachedSelector(
  getCanvasWidgetData,
  (canvasWidgetData: FlattenedWidgetProps) => {
    return DerivedPropFactory.getDerivedProperties(canvasWidgetData);
  },
)((canvasWidgets, widgetId) => {
  return widgetId;
});

export const getDerivedProperties = createSelector(
  getCanvasWidgets,
  (canvasWidgets: CanvasWidgetsReduxState): NameBindingsWithData => {
    const allDerivedProps: Record<string, object> = {};
    Object.keys(canvasWidgets).forEach(widgetId => {
      const widgetName = canvasWidgets[widgetId].widgetName;
      const widgetDerivedProps = getDerivedPropertiesForWidget(
        canvasWidgets,
        widgetId,
      );
      if (widgetDerivedProps) {
        allDerivedProps[widgetName] = widgetDerivedProps;
      }
    });

    return allDerivedProps;
  },
);

export const getNameBindingsWithDerivedData = createSelector(
  getDerivedProperties,
  getNameBindingsWithData,
  (
    derivedProps: NameBindingsWithData,
    nameBindingsWithData: NameBindingsWithData,
  ): NameBindingsWithData => {
    return _.merge(derivedProps, nameBindingsWithData);
  },
);
