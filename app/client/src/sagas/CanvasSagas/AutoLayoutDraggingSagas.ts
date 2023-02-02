import { updateAndSaveLayout, WidgetAddChild } from "actions/pageActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import {
  FlexLayerAlignment,
  LayoutDirection,
} from "utils/autoLayout/constants";
import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { GridDefaults } from "constants/WidgetConstants";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
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
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { HighlightInfo } from "utils/autoLayout/highlightUtils";

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
  const isMobile: boolean = yield select(getIsMobile);
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
        isMobile,
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
  isMobile?: boolean;
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
  const selectedWidgets = [...movedWidgets];

  let updatedWidgets: CanvasWidgetsReduxState = updateRelationships(
    selectedWidgets,
    widgets,
    parentId,
    false,
    isMobile,
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
  const parentWidget = allWidgets[allWidgets[parentId].parentId || "0"];
  const isAutoLayoutContainerCanvas = parentWidget.type === "CONTAINER_WIDGET";
  if (isAutoLayoutContainerCanvas) {
    const height =
      allWidgets[parentId].bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    updatedWidgets[parentWidget.widgetId] = {
      ...updatedWidgets[parentWidget.widgetId],
      bottomRow: parentWidget.topRow + height,
    };
  }
  const widgetsAfterPositionUpdate = updateWidgetPositions(
    updatedWidgets,
    parentId,
    isMobile,
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
