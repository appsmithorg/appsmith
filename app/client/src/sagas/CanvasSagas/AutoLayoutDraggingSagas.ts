import type { WidgetAddChild } from "actions/pageActions";
import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import type { FlexLayerAlignment } from "utils/autoLayout/constants";
import { LayoutDirection } from "utils/autoLayout/constants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import {
  addNewLayer,
  createFlexLayer,
  removeWidgetsFromCurrentLayers,
  updateExistingLayer,
  updateRelationships,
} from "utils/autoLayout/autoLayoutDraggingUtils";
import type {
  HighlightInfo,
  FlexLayer,
} from "utils/autoLayout/autoLayoutTypes";
import { updatePositionsOfParentAndSiblings } from "utils/autoLayout/positionUtils";
import { getCanvasWidth } from "selectors/editorSelectors";

function* addWidgetAndReorderSaga(
  actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    parentId: string;
    direction: LayoutDirection;
    dropPayload: HighlightInfo;
    addToBottom: boolean;
  }>,
) {
  const start = performance.now();
  const { addToBottom, direction, dropPayload, newWidget, parentId } =
    actionPayload.payload;
  const { alignment, index, isNewLayer, layerIndex, rowIndex } = dropPayload;
  const isMobile: boolean = yield select(getIsMobile);
  try {
    const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
      getUpdateDslAfterCreatingChild,
      {
        ...newWidget,
        widgetId: parentId,
      },
    );

    if (!parentId || !updatedWidgetsOnAddition[parentId]) {
      return updatedWidgetsOnAddition;
    }

    let widgetIndex = index;
    let currLayerIndex = layerIndex;

    const canvasWidget = updatedWidgetsOnAddition[parentId];

    if (addToBottom && canvasWidget.children && canvasWidget.flexLayers) {
      widgetIndex = canvasWidget.children.length;
      currLayerIndex = canvasWidget.flexLayers.length;
    }

    const updatedWidgetsOnMove: CanvasWidgetsReduxState = yield call(
      reorderAutolayoutChildren,
      {
        movedWidgets: [newWidget.newWidgetId],
        index: widgetIndex,
        isNewLayer,
        parentId,
        allWidgets: updatedWidgetsOnAddition,
        alignment,
        direction,
        layerIndex: currLayerIndex,
        rowIndex,
        isMobile,
      },
    );

    yield put(updateAndSaveLayout(updatedWidgetsOnMove));
    log.debug(
      "Auto Layout : add new widget took",
      performance.now() - start,
      "ms",
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.AUTOLAYOUT_ADD_NEW_WIDGETS,
        error,
      },
    });
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

  const { direction, dropPayload, movedWidgets, parentId } =
    actionPayload.payload;

  const { alignment, index, isNewLayer, layerIndex, rowIndex } = dropPayload;

  try {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const isMobile: boolean = yield select(getIsMobile);
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
        isMobile,
      },
    );

    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug(
      "Auto Layout : reorder computations took",
      performance.now() - start,
      "ms",
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.AUTOLAYOUT_REORDER_WIDGETS,
        error,
      },
    });
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
  layerIndex: number;
  rowIndex: number;
  isMobile: boolean;
}) {
  const {
    alignment,
    allWidgets,
    direction,
    index,
    isMobile,
    isNewLayer,
    layerIndex,
    movedWidgets,
    parentId,
    rowIndex,
  } = params;
  const widgets = Object.assign({}, allWidgets);
  if (!movedWidgets) return widgets;
  const mainCanvasWidth: number = yield select(getCanvasWidth);
  const selectedWidgets = [...movedWidgets];

  let updatedWidgets: CanvasWidgetsReduxState = updateRelationships(
    selectedWidgets,
    widgets,
    parentId,
    false,
    isMobile,
    mainCanvasWidth,
  );

  // Update flexLayers for a vertical stack.
  if (direction === LayoutDirection.Vertical) {
    const canvas = widgets[parentId];
    if (!canvas) return widgets;
    const flexLayers = canvas.flexLayers || [];

    // Remove moved widgets from the flex layers.
    const filteredLayers = removeWidgetsFromCurrentLayers(
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
          layerIndex,
          rowIndex,
        );
    updatedWidgets = movedWidgets.reduce((widgets, eachWidget) => {
      const widget = widgets[eachWidget];
      widgets[eachWidget] = {
        ...widget,
        alignment,
      };
      return widgets;
    }, updatedWidgets);
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
  const parentWidget =
    allWidgets[allWidgets[parentId].parentId || MAIN_CONTAINER_WIDGET_ID];
  const isAutoLayoutContainerCanvas = parentWidget.type === "CONTAINER_WIDGET";
  if (isAutoLayoutContainerCanvas) {
    const height =
      allWidgets[parentId].bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    updatedWidgets[parentWidget.widgetId] = {
      ...updatedWidgets[parentWidget.widgetId],
      bottomRow: parentWidget.topRow + height,
    };
  }
  const widgetsAfterPositionUpdate = updatePositionsOfParentAndSiblings(
    updatedWidgets,
    parentId,
    layerIndex,
    isMobile,
    mainCanvasWidth,
  );

  return widgetsAfterPositionUpdate;
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
