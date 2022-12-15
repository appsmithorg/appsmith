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
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { isArray } from "lodash";
import log from "loglevel";
import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  updateFlexChildColumns,
  updateSizeOfAllChildren,
} from "sagas/AutoLayoutUtils";
import { getWidgets } from "sagas/selectors";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import {
  ColumnSplitRatio,
  ColumnSplitTypes,
} from "utils/layoutPropertiesUtils";
import { generateReactKey } from "widgets/WidgetUtils";
import { moveWidget } from "./DraggingCanvasSagas";

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
  const { alignment, index, isNewLayer, layerIndex, rowIndex } = dropPayload;
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
        rowIndex,
      },
    );
    let updatedWidgetsAfterResizing = updatedWidgetsOnMove;
    if (
      !isNewLayer &&
      direction === LayoutDirection.Vertical &&
      layerIndex !== undefined
    )
      updatedWidgetsAfterResizing = updateFlexChildColumns(
        updatedWidgetsOnMove,
        layerIndex,
        parentId,
      );

    yield put(updateAndSaveLayout(updatedWidgetsAfterResizing));
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

  const { alignment, index, isNewLayer, layerIndex, rowIndex } = dropPayload;

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
        rowIndex,
      },
    );
    let updatedWidgetsAfterResizing = updatedWidgets;
    if (direction === LayoutDirection.Vertical)
      updatedWidgetsAfterResizing = updateSizeOfAllChildren(
        updatedWidgets,
        parentId,
      );

    yield put(updateAndSaveLayout(updatedWidgetsAfterResizing));
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
  rowIndex: number;
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
    rowIndex,
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
      ? addNewLayer(
          newLayer,
          updatedWidgets,
          parentId,
          filteredLayers,
          layerIndex,
        )
      : updateExistingLayer(
          newLayer,
          updatedWidgets,
          parentId,
          filteredLayers,
          index,
          layerIndex,
          rowIndex,
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
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
): CanvasWidgetsReduxState {
  const widgets = { ...allWidgets };
  // Check if parent has changed
  const orphans = movedWidgets.filter(
    (item) => widgets[item].parentId !== parentId,
  );
  let prevParentId: string | undefined;
  if (orphans && orphans.length) {
    //parent has changed
    orphans.forEach((item) => {
      // remove from previous parent
      prevParentId = widgets[item].parentId;
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
  if (prevParentId) {
    return updateSizeOfAllChildren(widgets, prevParentId);
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
  index = 0,
  layerIndex = 0,
  rowIndex: number,
): CanvasWidgetsReduxState {
  try {
    const widgets: CanvasWidgetsReduxState = Object.assign({}, allWidgets);
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
      hasFillChild: newLayer.hasFillChild || layers[layerIndex]?.hasFillChild,
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
    console.error("#### update existing layer error", e);
    return allWidgets;
  }
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

function* updateColumnSplitProperty(
  actionPayload: ReduxAction<{
    widgetId: string;
    updatedValue: ColumnSplitTypes;
  }>,
) {
  const { updatedValue, widgetId } = actionPayload.payload;
  const canvasRatio = ColumnSplitRatio[updatedValue];
  let allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  allWidgets = {
    ...allWidgets,
    [widgetId]: {
      ...allWidgets[widgetId],
      columnSplitType: updatedValue,
    },
  };
  const expectedCanvas = canvasRatio.length;
  const widgetCanvases = allWidgets[widgetId].children || [];
  const numberOfCanvas = widgetCanvases.length;
  console.log("updating the prop", allWidgets[widgetCanvases[0]]);
  console.log(
    "flexLayer",
    allWidgets[widgetCanvases[0]].flexLayers,
    allWidgets[widgetCanvases[0]].children,
  );

  if (numberOfCanvas && expectedCanvas !== numberOfCanvas) {
    const baseCanvasId = widgetCanvases[0];
    const baseCanvas = allWidgets[baseCanvasId];
    // add/remove the canvas widget
    if (expectedCanvas < numberOfCanvas) {
      // delete the last canvas and add widgets to first canvas

      if (baseCanvas) {
        const canvasToBeDeleted = widgetCanvases.slice(1);
        const widgetsToMove = widgetCanvases.reduce((movingWidgets, each) => {
          const widgetChildren = allWidgets[each].children || [];
          movingWidgets = [...movingWidgets, ...widgetChildren];
          return movingWidgets;
        }, [] as string[]);

        const updatedWidgets = widgetsToMove.reduce((widgetsObj, each) => {
          const widgetProps = allWidgets[each];
          return moveWidget({
            ...widgetProps,
            parentId: widgetProps.parentId || "0",
            newParentId: baseCanvasId,
            widgetId: each,
            allWidgets: widgetsObj,
          });
        }, allWidgets);
        const flexUpdatedWidgets = canvasToBeDeleted.reduce(
          (widgetsObj, each) => {
            const baseWidget = widgetsObj[baseCanvasId];
            const container = widgetsObj[widgetId];
            const updatedBaseWidget = {
              ...baseWidget,
              flexLayers: [
                ...baseWidget.flexLayers,
                ...widgetsObj[each].flexLayers,
              ],
            };
            // update the parent
            const widgetUpdate = {
              ...container,
              children: (container.children || []).filter(
                (eachChild) => eachChild !== each,
              ),
            };
            return {
              ...widgetsObj,
              [baseCanvasId]: updatedBaseWidget,
              [widgetId]: widgetUpdate,
            } as CanvasWidgetsReduxState;
          },
          updatedWidgets,
        );
        yield put(
          updateAndSaveLayout({
            ...flexUpdatedWidgets,
            [widgetId]: {
              ...flexUpdatedWidgets[widgetId],
              columnSplitType: updatedValue,
            },
          }),
        );
      }
    } else {
      const newCanvasId = generateReactKey();

      const canvasPayload: any = {
        widgetId,
        type: "CANVAS_WIDGET",
        leftColumn: 0,
        topRow: 0,
        columns: baseCanvas.rightColumn - baseCanvas.leftColumn,
        rows: baseCanvas.bottomRow - baseCanvas.topRow,
        canExtend: true,
        parentRowSpace: 1,
        parentColumnSpace: 1,
        responsiveBehavior: "fill",
        newWidgetId: newCanvasId,
      };
      const updatedWidgets: {
        [widgetId: string]: FlattenedWidgetProps;
      } = yield call(getUpdateDslAfterCreatingChild, canvasPayload);
      yield put(
        updateAndSaveLayout({
          ...updatedWidgets,
          [widgetId]: {
            ...updatedWidgets[widgetId],
            columnSplitType: updatedValue,
          },
        }),
      );

      console.log("creating canvas", { updatedWidgets });
      // add canvas
    }
  } else {
    yield put(updateAndSaveLayout(allWidgets));
  }
  // set ratios based on column split selected
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
    takeLatest(
      ReduxActionTypes.UPDATE_COLUMN_SPLIT_PROPERTY,
      updateColumnSplitProperty,
    ),
  ]);
}
