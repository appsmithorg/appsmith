import {
  CONTAINER_GRID_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpacesWhileMoving } from "selectors/editorSelectors";
import type { WidgetSpace } from "constants/CanvasEditorConstants";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import { widgetOperationParams } from "utils/WidgetPropsUtils";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useContext, useEffect, useRef } from "react";
import type { AutoCanvasDraggingArenaProps } from "../AutoCanvasDraggingArena";
import type { WidgetDraggingBlock } from "../../../../common/CanvasArenas/ArenaTypes";
import type { HighlightInfo } from "layoutSystems/autolayout/utils/autoLayoutTypes";
import {
  LayoutDirection,
  AlignItems,
} from "layoutSystems/autolayout/utils/constants";
import {
  getBlocksToDraw,
  getUpdateRelativeRowsMethod,
} from "layoutSystems/common/utils/canvasDraggingUtils";

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
  const occupiedSpaces = useSelector(getOccupiedSpacesWhileMoving, equal) || {};
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
  const getDragCenterSpace = () => {
    if (dragCenter && dragCenter.widgetId) {
      // Dragging by widget
      return (
        childrenOccupiedSpaces.find(
          (each) => each.id === dragCenter.widgetId,
        ) || {}
      );
    } else if (
      dragCenter &&
      Number.isInteger(dragCenter.top) &&
      Number.isInteger(dragCenter.left)
    ) {
      // Dragging by Widget selection box
      return dragCenter;
    } else {
      return {};
    }
  };

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

  const dragCenterSpace: any = getDragCenterSpace();

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
  const parentDiff = isDragging
    ? {
        top:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.top * snapRowSpace + containerPadding
            : containerPadding,
        left:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.left * snapColumnSpace + containerPadding
            : containerPadding,
      }
    : {
        top: 0,
        left: 0,
      };

  const relativeStartPoints =
    isDragging && !isEmpty(dragCenterSpace)
      ? {
          left:
            ((isChildOfCanvas ? dragCenterSpace.left : 0) +
              dragDetails.dragOffset.left) *
              snapColumnSpace +
            2 * containerPadding,
          top:
            ((isChildOfCanvas ? dragCenterSpace.top : 0) +
              dragDetails.dragOffset.top) *
              snapRowSpace +
            2 * containerPadding,
        }
      : defaultHandlePositions;

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
    updateRelativeRows: getUpdateRelativeRowsMethod(
      updateDropTargetRows,
      snapColumnSpace,
      snapRowSpace,
    ),
  };
};
