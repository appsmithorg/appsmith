import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { isArray } from "lodash";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { updateWidgetPositions } from "./positionUtils";
import type { FlexLayer, LayerChild } from "./types";

/**
 * Transform movedWidgets to FlexLayer format,
 * and determine if the new widgets have a fill child.
 * @param movedWidgets
 * @param allWidgets
 * @param alignment
 * @returns FlexLayer
 */
export function createFlexLayer(
  movedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
  alignment: FlexLayerAlignment,
): FlexLayer {
  const children = [];

  if (movedWidgets && movedWidgets.length) {
    for (const id of movedWidgets) {
      const widget = allWidgets[id];

      if (!widget) continue;

      children.push({ id, align: alignment });
    }
  }

  return { children };
}

/**
 * Remove moved widgets from current layers.
 * Return non-empty layers.
 * @param allWidgets
 * @param movedWidgets
 * @param flexLayers
 * @returns FlexLayer[]
 */
export function removeWidgetsFromCurrentLayers(
  movedWidgets: string[],
  flexLayers: FlexLayer[],
): FlexLayer[] {
  if (!flexLayers || !flexLayers.length) return [];

  return flexLayers?.reduce((acc: FlexLayer[], layer: FlexLayer) => {
    const children = layer.children.filter(
      (each: LayerChild) => movedWidgets.indexOf(each.id) === -1,
    );

    if (children.length) {
      acc.push({
        ...layer,
        children,
      });
    }

    return acc;
  }, []);
}

/**
 * For all moved widgets,
 * delete relationship with previous parent and
 * add relationship with new parent
 * @param movedWidgets
 * @param widgets
 * @param parentId
 * @returns widgets
 */
export function updateRelationships(
  movedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  onlyUpdateFlexLayers = false,
  isMobile = false,
  mainCanvasWidth: number,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaProps?: Record<string, any>,
): CanvasWidgetsReduxState {
  const widgets = { ...allWidgets };
  // Check if parent has changed
  const orphans = movedWidgets.filter(
    (item) => widgets[item].parentId !== parentId,
  );
  const prevParents: string[] = [];

  if (orphans && orphans.length) {
    //parent has changed
    orphans.forEach((item) => {
      // remove from previous parent
      const prevParentId = widgets[item].parentId;

      if (prevParentId !== undefined) {
        prevParents.push(prevParentId);
        const prevParent = Object.assign({}, widgets[prevParentId]);

        if (isArray(prevParent.children)) {
          const updatedPrevParent = {
            ...prevParent,
            children: onlyUpdateFlexLayers
              ? prevParent.children
              : prevParent.children.filter((each) => each !== item),
            flexLayers:
              prevParent.flexLayers !== undefined &&
              removeWidgetsFromCurrentLayers(
                movedWidgets,
                prevParent.flexLayers,
              ),
          };

          widgets[prevParentId] = updatedPrevParent;
        }
      }

      // add to new parent
      if (!onlyUpdateFlexLayers) {
        widgets[item] = {
          ...widgets[item],
          parentId: parentId,
        };
      }
    });
  }

  if (prevParents.length) {
    for (const id of prevParents) {
      const updatedWidgets = updateWidgetPositions(
        widgets,
        id,
        isMobile,
        mainCanvasWidth,
        false,
        metaProps,
      );

      return updatedWidgets;
    }
  }

  return widgets;
}

/**
 * If widgets are dropped into a new vertical position in an auto-layout canvas,
 * then add a new FlexLayer to contain the new widgets.
 * Use the layerIndex to add the new layer at the right position.
 * @param newLayer | FlexLayer
 * @param allWidgets | CanvasWidgetsReduxState
 * @param parentId | string
 * @param layers | FlexLayer[]
 * @param layerIndex | number
 * @returns CanvasWidgetsReduxState
 */
export function addNewLayer(
  newLayer: FlexLayer,
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  layers: FlexLayer[],
  layerIndex = 0,
): CanvasWidgetsReduxState {
  const widgets: CanvasWidgetsReduxState = Object.assign({}, allWidgets);
  const canvas = widgets[parentId];

  const pos = layerIndex > layers.length ? layers.length : layerIndex;

  const updatedCanvas = {
    ...canvas,
    flexLayers: [...layers.slice(0, pos), newLayer, ...layers.slice(pos)],
  };

  const updatedWidgets = {
    ...widgets,
    [parentId]: updatedCanvas,
  };

  return updatedWidgets;
}

/**
 *
 * @param newLayer | FlexLayer : FlexLayer comprised of the moved widgets and selected alignment.
 * @param allWidgets | CanvasWidgetsReduxState
 * @param parentId | string : new parentId
 * @param layers | FlexLayer[] : flexLayers of new parent.
 * @param layerIndex | number : index of existing layer to add the moved widgets to.
 * @param rowIndex | number : starting index of the moved widgets within an alignment in the selected layer.
 * @returns CanvasWidgetsReduxState
 */
export function updateExistingLayer(
  newLayer: FlexLayer,
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  layers: FlexLayer[],
  layerIndex = 0,
  rowIndex: number,
): CanvasWidgetsReduxState {
  try {
    const widgets: CanvasWidgetsReduxState = { ...allWidgets };
    const canvas = widgets[parentId];

    if (!canvas || !newLayer) return widgets;

    const map: { [key: string]: LayerChild[] } = {
      [FlexLayerAlignment.Start]: [],
      [FlexLayerAlignment.Center]: [],
      [FlexLayerAlignment.End]: [],
    };

    for (const child of layers[layerIndex]?.children) {
      map[child.align] = [...map[child.align], child];
    }

    const alignment = newLayer.children[0].align;

    map[alignment] = [
      ...map[alignment].slice(0, rowIndex),
      ...newLayer?.children,
      ...map[alignment].slice(rowIndex),
    ];

    // merge the selected layer with the new layer.
    const selectedLayer = {
      ...layers[layerIndex],
      children: [
        ...map[FlexLayerAlignment.Start],
        ...map[FlexLayerAlignment.Center],
        ...map[FlexLayerAlignment.End],
      ],
    };

    const updatedCanvas = {
      ...canvas,
      flexLayers: [
        ...layers.slice(0, layerIndex),
        selectedLayer,
        ...layers.slice(layerIndex + 1),
      ],
    };

    const updatedWidgets = { ...widgets, [parentId]: updatedCanvas };

    return updatedWidgets;
  } catch (e) {
    return allWidgets;
  }
}
