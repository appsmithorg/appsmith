import type { WidgetAddChild } from "actions/pageActions";
import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { LayoutDirection } from "layoutSystems/common/utils/constants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import {
  addNewLayer,
  createFlexLayer,
  removeWidgetsFromCurrentLayers,
  updateExistingLayer,
  updateRelationships,
} from "layoutSystems/autolayout/utils/autoLayoutDraggingUtils";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import { updatePositionsOfParentAndSiblings } from "layoutSystems/autolayout/utils/positionUtils";
import {
  getCanvasWidth,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";

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
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  try {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newParams: { [key: string]: any } = yield call(
      executeWidgetBlueprintBeforeOperations,
      BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
      {
        parentId,
        widgetId: newWidget.newWidgetId,
        widgets: allWidgets,
        widgetType: newWidget.type,
      },
    );
    const updatedParams: WidgetAddChild = { ...newWidget, ...newParams };
    const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
      getUpdateDslAfterCreatingChild,
      {
        ...updatedParams,
        widgetId: parentId,
      },
    );

    if (!parentId || !updatedWidgetsOnAddition[parentId]) {
      return updatedWidgetsOnAddition;
    }

    let widgetIndex = index;
    let currLayerIndex = layerIndex;
    let newLayer = isNewLayer;

    const canvasWidget = updatedWidgetsOnAddition[parentId];

    if (addToBottom && canvasWidget.children && canvasWidget.flexLayers) {
      widgetIndex = canvasWidget.children.length;
      currLayerIndex = canvasWidget.flexLayers.length;
      newLayer = true;
    }

    const updatedWidgetsOnMove: CanvasWidgetsReduxState = yield call(
      reorderAutolayoutChildren,
      {
        movedWidgets: [newWidget.newWidgetId],
        index: widgetIndex,
        isNewLayer: newLayer,
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
      "Auto-layout : add new widget took",
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
    const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);

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
      "Auto-layout : reorder computations took",
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);

  let updatedWidgets: CanvasWidgetsReduxState = updateRelationships(
    selectedWidgets,
    widgets,
    parentId,
    false,
    isMobile,
    mainCanvasWidth,
    metaProps,
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
  const isAutoLayoutContainerCanvas =
    parentWidget.type === "CONTAINER_WIDGET" &&
    !parentWidget.isListItemContainer;

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
    false,
    metaProps,
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
