import { isArray } from "lodash";
import { updateAndSaveLayout, WidgetAddChild } from "actions/pageActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import {
  FlexLayerAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "components/constants";
import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import log from "loglevel";
import { getWidgets } from "sagas/selectors";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";

function* addWidgetAndReorderSaga(
  actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    parentId: string;
    direction: LayoutDirection;
    dropPayload: HighlightInfo;
  }>,
) {
  const start = performance.now();
  const { direction, dropPayload, newWidget, parentId } = actionPayload.payload;
  const { alignment, index, isNewLayer, layerIndex } = dropPayload;
  try {
    const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
      getUpdateDslAfterCreatingChild,
      {
        ...newWidget,
        widgetId: parentId,
      },
    );

    const updatedWidgetsOnMove: CanvasWidgetsReduxState = yield call(
      reorderAutolayoutChildren,
      {
        movedWidgets: [newWidget.newWidgetId],
        index,
        isNewLayer,
        parentId,
        allWidgets: updatedWidgetsOnAddition,
        alignment,
        direction,
        layerIndex,
      },
    );
    yield put(updateAndSaveLayout(updatedWidgetsOnMove));
    log.debug("reorder computations took", performance.now() - start, "ms");
  } catch (e) {
    // console.error(e);
  }
}

function* autoLayoutReorderSaga(
  actionPayload: ReduxAction<{
    movedWidgets: string[];
    parentId: string;
    direction: LayoutDirection;
    dropPayload: HighlightInfo;
  }>,
) {
  const start = performance.now();

  const {
    direction,
    dropPayload,
    movedWidgets,
    parentId,
  } = actionPayload.payload;

  const { alignment, index, isNewLayer, layerIndex } = dropPayload;

  try {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    if (!parentId || !movedWidgets || !movedWidgets.length) return;
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      reorderAutolayoutChildren,
      {
        movedWidgets,
        index,
        isNewLayer,
        parentId,
        allWidgets,
        alignment,
        direction,
        layerIndex,
      },
    );

    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("reorder computations took", performance.now() - start, "ms");
  } catch (e) {
    // console.error(e);
  }
}

function* reorderAutolayoutChildren(params: {
  movedWidgets: string[];
  index: number;
  isNewLayer: boolean;
  parentId: string;
  allWidgets: CanvasWidgetsReduxState;
  alignment: FlexLayerAlignment;
  direction: LayoutDirection;
  layerIndex?: number;
}) {
  const {
    alignment,
    allWidgets,
    direction,
    index,
    isNewLayer,
    layerIndex,
    movedWidgets,
    parentId,
  } = params;
  const widgets = Object.assign({}, allWidgets);
  if (!movedWidgets) return widgets;
  const selectedWidgets = [...movedWidgets];

  let updatedWidgets: CanvasWidgetsReduxState = updateRelationships(
    selectedWidgets,
    widgets,
    parentId,
  );

  // Update flexLayers for a vertical stack.
  if (direction === LayoutDirection.Vertical) {
    const canvas = widgets[parentId];
    if (!canvas) return widgets;
    const flexLayers = canvas.flexLayers || [];
    // Remove moved widgets from the flex layers.
    const filteredLayers = removeWidgetsFromCurrentLayers(
      widgets,
      selectedWidgets,
      flexLayers,
    );
    // Create a temporary layer from moved widgets.
    const newLayer: FlexLayer = createFlexLayer(
      selectedWidgets,
      widgets,
      alignment,
    );

    // Add the new layer to the flex layers.
    updatedWidgets = isNewLayer
      ? addNewLayer(newLayer, widgets, parentId, filteredLayers, layerIndex)
      : updateExistingLayer(
          newLayer,
          widgets,
          parentId,
          filteredLayers,
          index,
          layerIndex,
        );
  }

  // update children of the parent canvas.
  const items = [...(widgets[parentId].children || [])];
  // remove moved widgets from children
  const newItems = items.filter((item) => movedWidgets.indexOf(item) === -1);
  // calculate valid position for drop
  const pos = index > newItems.length ? newItems.length : index;
  updatedWidgets[parentId] = {
    ...updatedWidgets[parentId],
    children: [
      ...newItems.slice(0, pos),
      ...movedWidgets,
      ...newItems.slice(pos),
    ],
  };

  return updatedWidgets;
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
function updateRelationships(
  movedWidgets: string[],
  widgets: CanvasWidgetsReduxState,
  parentId: string,
): CanvasWidgetsReduxState {
  // Check if parent has changed
  const orphans = movedWidgets.filter(
    (item) => widgets[item].parentId !== parentId,
  );
  if (orphans && orphans.length) {
    //parent has changed
    orphans.forEach((item) => {
      // remove from previous parent
      const prevParentId = widgets[item].parentId;
      if (prevParentId !== undefined) {
        const prevParent = Object.assign({}, widgets[prevParentId]);
        if (prevParent.children && isArray(prevParent.children)) {
          const updatedPrevParent = {
            ...prevParent,
            children: prevParent.children.filter((each) => each !== item),
            flexLayers: removeWidgetsFromCurrentLayers(
              widgets,
              movedWidgets,
              prevParent.flexLayers,
            ),
          };
          widgets[prevParentId] = updatedPrevParent;
        }
      }

      // add to new parent
      widgets[item] = {
        ...widgets[item],
        parentId: parentId,
      };
    });
  }
  return widgets;
}

function addNewLayer(
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

function updateExistingLayer(
  newLayer: FlexLayer,
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  layers: FlexLayer[],
  index: number,
  layerIndex = 0,
): CanvasWidgetsReduxState {
  const widgets: CanvasWidgetsReduxState = Object.assign({}, allWidgets);
  const canvas = widgets[parentId];
  if (!canvas || !newLayer) return widgets;

  let selectedLayer: FlexLayer = layers[layerIndex];
  // Calculate the number of children in the container before the selected layer.
  let childCount = 0;
  layers.forEach((layer: FlexLayer, index: number) => {
    if (index >= layerIndex) return;
    childCount += layer.children.length;
  });
  const pos = index - childCount;

  // merge the selected layer with the new layer.
  selectedLayer = {
    ...selectedLayer,
    children: [
      ...selectedLayer?.children?.slice(0, pos),
      ...newLayer?.children,
      ...selectedLayer?.children?.slice(pos),
    ],
    hasFillChild: newLayer.hasFillChild || selectedLayer?.hasFillChild,
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
}

/**
 * Transform movedWidgets to FlexLayer format,
 * and determine if the new widgets have a fill child.
 * @param movedWidgets
 * @param allWidgets
 * @param alignment
 * @returns hasFillChild: boolean, layerChildren: string[]
 */
function createFlexLayer(
  movedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
  alignment: FlexLayerAlignment,
): FlexLayer {
  let hasFillChild = false;
  const children = [];
  if (movedWidgets && movedWidgets.length) {
    for (const id of movedWidgets) {
      const widget = allWidgets[id];
      if (!widget) continue;
      if (widget.responsiveBehavior === ResponsiveBehavior.Fill)
        hasFillChild = true;
      children.push({ id, align: alignment });
    }
  }
  return { children, hasFillChild };
}

/**
 * Remove moved widgets from current layers.
 * and update hasFillChild property.
 * Return non-empty layers.
 * @param allWidgets
 * @param movedWidgets
 * @param flexLayers
 * @returns FlexLayer[]
 */
export function removeWidgetsFromCurrentLayers(
  allWidgets: CanvasWidgetsReduxState,
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
        hasFillChild: children.some(
          (each: LayerChild) =>
            allWidgets[each.id].responsiveBehavior === ResponsiveBehavior.Fill,
        ),
      });
    }
    return acc;
  }, []);
}

export default function* autoLayoutDraggingSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.AUTOLAYOUT_REORDER_WIDGETS,
      autoLayoutReorderSaga,
    ),
    takeLatest(
      ReduxActionTypes.AUTOLAYOUT_ADD_NEW_WIDGETS,
      addWidgetAndReorderSaga,
    ),
  ]);
}
