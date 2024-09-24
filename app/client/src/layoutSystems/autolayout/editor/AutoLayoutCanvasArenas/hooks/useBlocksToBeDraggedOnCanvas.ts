import {
  CONTAINER_GRID_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { AppState } from "ee/reducers";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpacesWhileMoving } from "selectors/editorSelectors";
import type { WidgetSpace } from "constants/CanvasEditorConstants";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import { widgetOperationParams } from "utils/WidgetPropsUtils";
import { DropTargetContext } from "layoutSystems/common/dropTarget/DropTargetComponent";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useContext, useEffect, useRef } from "react";
import type { AutoCanvasDraggingArenaProps } from "../AutoCanvasDraggingArena";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import {
  LayoutDirection,
  AlignItems,
} from "layoutSystems/common/utils/constants";
import {
  getBlocksToDraw,
  getParentDiff,
  getRelativeStartPoints,
  getBoundUpdateRelativeRowsMethod,
  getDragCenterSpace,
} from "layoutSystems/common/utils/canvasDraggingUtils";
import type { WidgetDraggingBlock } from "layoutSystems/common/canvasArenas/ArenaTypes";

/**
 * useBlocksToBeDraggedOnCanvas, provides information or functions/methods related to drag n drop,
 * that can be used to draw rectangle blocks on canvas, information of widgets being dragged on canvas, method to dispatch action on drop etc...
 * @param useBlocksToBeDraggedOnCanvas is an object that includes properties like
 * @prop alignItems, defines the alignment of elements on widget canvas
 * @prop direction, defines direction of alignment of widgets on canvas
 * @prop noPad, indicates if the widget canvas has padding
 * @prop snapColumnSpace, width between two columns grid
 * @prop snapRows, number of rows in the canvas
 * @prop snapRowSpace, height between two row grid
 * @prop widgetId, id of the current widget canvas associated with current AutoCanvasDraggingArena
 * @returns object containing,
 * @returnProp blocksToDraw, contains information regarding the widget and positions in pixels
 * @returnProp defaultHandlePositions, position of the grab handle of the widget with respect to the widget
 * @returnProp isChildOfCanvas, indicates if the dragging widgets are the original child of the canvas
 * @returnProp isCurrentDraggedCanvas, indicates if the widget is being dragged on the canvas associated with this hook
 * @returnProp isDragging, indicates if editor is in widget dragging mode
 * @returnProp isNewWidget, indicates if it is a new Widget
 * @returnProp isNewWidgetInitialTargetCanvas, indicates if the new widget is being dragged on the main canvas
 * @returnProp isResizing, indicates if any widget is currently being resized
 * @returnProp parentDiff, positions in pixels that needs to be offsetted with the widget's positions to get it's actual position on parent canvas
 * @returnProp relativeStartPoints, the relative drag start points of the dragging blocks with respect to the dragging group's center
 * @returnProp rowRef, ref object of number of rows on canvas
 * @returnProp updateChildrenPositions, is called when dragging widgets is dropped to dispatch action to update widget positions on canvas
 * @returnProp updateRelativeRows, is used to update bottom rows of the canvas
 */
export const useBlocksToBeDraggedOnCanvas = ({
  alignItems,
  direction,
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: AutoCanvasDraggingArenaProps) => {
  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
  const containerPadding = noPad ? 0 : CONTAINER_GRID_PADDING;
  const lastDraggedCanvas = useRef<string | undefined>(undefined);

  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const draggingCanvas = useSelector(
    getWidgetByID(dragDetails.draggedOn || ""),
  );

  useEffect(() => {
    if (
      dragDetails.draggedOn &&
      draggingCanvas &&
      draggingCanvas.parentId &&
      ![widgetId, MAIN_CONTAINER_WIDGET_ID].includes(dragDetails.draggedOn)
    ) {
      lastDraggedCanvas.current = draggingCanvas.parentId;
    }
  }, [dragDetails.draggedOn]);
  const defaultHandlePositions = {
    top: 20,
    left: 20,
  };
  const {
    draggingGroupCenter: dragCenter,
    dragGroupActualParent: dragParent,
    newWidget,
  } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const occupiedSpaces = useSelector(getOccupiedSpacesWhileMoving, equal);
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: WidgetSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const allWidgets = useSelector(getWidgets);

  // modify the positions to have grab position on the right side for new widgets
  if (isNewWidget) {
    defaultHandlePositions.left =
      newWidget.columns * snapColumnSpace - defaultHandlePositions.left;
  }

  const { blocksToDraw } = getBlocksToDraw(
    newWidget,
    allWidgets,
    isNewWidget,
    snapColumnSpace,
    snapRowSpace,
    childrenOccupiedSpaces,
    selectedWidgets,
    containerPadding,
  );

  const dragCenterSpace = getDragCenterSpace(
    dragCenter,
    childrenOccupiedSpaces,
  );

  const { updateDropTargetRows } = useContext(DropTargetContext);

  const updateChildrenPositions = (
    dropPayload: HighlightInfo,
    drawingBlocks: WidgetDraggingBlock[],
  ): void => {
    if (isNewWidget) addNewWidgetToAutoLayout(dropPayload, drawingBlocks);
    else
      dispatch({
        type: ReduxActionTypes.AUTOLAYOUT_REORDER_WIDGETS,
        payload: {
          dropPayload,
          movedWidgets: selectedWidgets,
          parentId: widgetId,
          direction,
        },
      });
  };

  const addNewWidgetToAutoLayout = (
    dropPayload: HighlightInfo,
    drawingBlocks: WidgetDraggingBlock[],
  ) => {
    const blocksToUpdate = drawingBlocks.map((each) => {
      const updateWidgetParams = widgetOperationParams(
        newWidget,
        { x: 0, y: each.top },
        { x: 0, y: 0 },
        snapColumnSpace,
        snapRowSpace,
        newWidget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
        {
          width: each.width,
          height: each.height,
        },
        direction === LayoutDirection.Vertical &&
          alignItems === AlignItems.Stretch,
      );

      return {
        ...each,
        updateWidgetParams,
      };
    });
    // Add alignment to props of the new widget
    const widgetPayload = {
      ...blocksToUpdate[0]?.updateWidgetParams?.payload,
      props: {
        ...blocksToUpdate[0]?.updateWidgetParams?.payload?.props,
        alignment: dropPayload.alignment,
      },
    };

    dispatch({
      type: ReduxActionTypes.AUTOLAYOUT_ADD_NEW_WIDGETS,
      payload: {
        dropPayload,
        newWidget: widgetPayload,
        parentId: newWidget.detachFromLayout
          ? MAIN_CONTAINER_WIDGET_ID
          : widgetId,
        direction,
        addToBottom: newWidget.detachFromLayout,
      },
    });

    //Addition of setTimeout to wait for the new widget to be added to the canvas before selecting
    //TODO: this should be moved to the sagas to avoid this setTimeout
    setTimeout(() => {
      selectWidget(SelectionRequestType.One, [widgetPayload.newWidgetId]);
    }, 100);
  };

  const rowRef = useRef(snapRows);

  useEffect(() => {
    rowRef.current = snapRows;
  }, [snapRows, isDragging]);

  const isChildOfCanvas = dragParent === widgetId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === widgetId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && widgetId === MAIN_CONTAINER_WIDGET_ID;

  const parentDiff = getParentDiff(
    dragCenterSpace,
    isDragging,
    isChildOfCanvas,
    snapRowSpace,
    snapColumnSpace,
    containerPadding,
  );

  const relativeStartPoints = getRelativeStartPoints(
    dragCenterSpace,
    dragDetails.dragOffset,
    defaultHandlePositions,
    isDragging,
    isChildOfCanvas,
    snapRowSpace,
    snapColumnSpace,
    containerPadding,
  );

  return {
    blocksToDraw,
    defaultHandlePositions,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    parentDiff,
    relativeStartPoints,
    rowRef,
    updateChildrenPositions,
    updateRelativeRows: getBoundUpdateRelativeRowsMethod(
      updateDropTargetRows,
      snapColumnSpace,
      snapRowSpace,
    ),
  };
};
