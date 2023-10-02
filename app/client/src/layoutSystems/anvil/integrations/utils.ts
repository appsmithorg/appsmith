import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";

/**
 * This method is used to determine all the affected widgets from all the layers that have changed
 * @param layersProcessQueue Changed layer Ids, will have one layer id per canvas
 * @param widgets all widget dsl Properties
 * @returns list of all affected widgets
 */
export function getAffectedWidgetsFromLayers(
  layersProcessQueue: {
    [canvasId: string]: number;
  },
  widgets: CanvasWidgetsReduxState,
) {
  let affectedWidgets: { [widgetDOMId: string]: boolean } = {};

  //Even though it has many nested iterations it will go through all teh affected widgets only once
  //Iterate through all the canvases and it's first layer that got affected
  for (const [canvasId, layerIndex] of Object.entries(layersProcessQueue)) {
    const flexLayers = widgets[canvasId]?.flexLayers || [];

    //iterate through all the layers below the changed layer id inculuding the layer
    for (let i = layerIndex; i < flexLayers.length; i++) {
      const children = flexLayers[i]?.children || [];
      //iterate through all the child widgets inside the layer
      for (const child of children) {
        const childWidget = widgets[child.id];

        if (!childWidget) continue;

        affectedWidgets[child.id] = true;

        //if the widget has children get all the nested children
        if (childWidget.children && childWidget.children.length > 0) {
          affectedWidgets = {
            ...affectedWidgets,
            ...getAllChildWidgets(childWidget, widgets, layersProcessQueue),
          };
        }
      }
    }
  }

  return affectedWidgets;
}

/**
 * This Method gets all the nested child widgets,
 * within the given widgets ignoring the canvas type widgets
 * @param widget Widget whose nested children have to be found
 * @param widgets all widget dsl Properties
 * @returns list of all the nested child widgets of widget
 */
export function getAllChildWidgets(
  widget: WidgetProps,
  widgets: CanvasWidgetsReduxState,
  layersProcessQueue?: {
    [canvasId: string]: number;
  },
) {
  let childWidgets: { [widgetDOMId: string]: boolean } = {};

  const children = widget.children;

  //iterate through children if widget
  for (const childId of children) {
    const childWidget = widgets[childId];

    if (!childWidget) continue;

    //if the child widget is not a canvas add it to the list
    if (!childWidget.detachFromLayout) {
      childWidgets[childId] = true;
    } else if (layersProcessQueue) {
      //If it is a canvas widget remove the widget from the layer queue to avoid processing it again
      delete layersProcessQueue[childId];
    }

    //if the widget further has nested children call the getAllChildWidgets recursively.
    if (childWidget.children && childWidget.children.length > 0) {
      childWidgets = {
        ...childWidgets,
        ...getAllChildWidgets(childWidget, widgets, layersProcessQueue),
      };
    }
  }

  return childWidgets;
}
