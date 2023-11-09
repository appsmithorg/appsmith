import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useMemo } from "react";
import { getSelectedWidgets } from "selectors/ui";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";
import { getDropTargetLayoutId } from "layoutSystems/anvil/integrations/selectors";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import WidgetFactory from "WidgetProvider/factory";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPositions } from "layoutSystems/common/types";

interface AnvilDnDStatesProps {
  allowedWidgetTypes: string[];
  canvasId: string;
  layoutId: string;
}

export interface AnvilDnDStates {
  activateOverlayWidgetDrop: boolean;
  allowToDrop: boolean;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  selectedWidgets: string[];
  isChildOfLayout: boolean;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isNewWidget: boolean;
  isNewWidgetInitialTargetCanvas: boolean;
  isResizing: boolean;
  layoutElementPositions: LayoutElementPositions;
  mainCanvasLayoutId: string;
}

const AnvilOverlayWidgetTypes = ["MODAL_WIDGET"];

/**
 * getDraggedBlocks function returns an array of DraggedWidget.
 * If the dragged widget is a new widget pulled out of the widget cards,
 * specific info like type, widgetId and responsiveBehavior are filled using dragDetails
 */

const getDraggedBlocks = (
  isNewWidget: boolean,
  dragDetails: DragDetails,
  selectedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
): DraggedWidget[] => {
  if (isNewWidget) {
    const { newWidget } = dragDetails;
    return [
      {
        widgetId: newWidget.widgetId,
        type: newWidget.type,
        responsiveBehavior:
          newWidget.responsiveBehavior ??
          WidgetFactory.getConfig(newWidget.type)?.responsiveBehavior,
      },
    ];
  } else {
    return selectedWidgets.map((eachWidgetId) => ({
      type: allWidgets[eachWidgetId].type,
      widgetId: eachWidgetId,
      responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
    }));
  }
};

/**
 * function to validate if the widget(s) being dragged is supported by the canvas.
 * ex: In a From widget the header will not accept widgets like Table/List.
 */
const checkIfWidgetTypeDraggedIsAllowedToDrop = (
  allowedWidgetTypes: string[],
  isNewWidget: boolean,
  dragDetails: DragDetails,
  selectedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
) => {
  if (allowedWidgetTypes.length === 0) {
    return true;
  }
  if (isNewWidget) {
    const { newWidget } = dragDetails;
    return allowedWidgetTypes.includes(newWidget.type);
  } else {
    return selectedWidgets.every((eachWidgetId) => {
      return allowedWidgetTypes.includes(allWidgets[eachWidgetId].type);
    });
  }
};

export const useAnvilDnDStates = ({
  allowedWidgetTypes,
  layoutId,
}: AnvilDnDStatesProps): AnvilDnDStates => {
  const mainCanvasLayoutId: string = useSelector((state) =>
    getDropTargetLayoutId(state, MAIN_CONTAINER_WIDGET_ID),
  );
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const allWidgets = useSelector(getWidgets);
  const selectedWidgets = useSelector(getSelectedWidgets);
  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  /**
   * boolean to indicate if the widget being dragged is a new widget
   */
  const isNewWidget = !!newWidget && !dragParent;
  /**
   * boolean to indicate if the widget being dragged is this particular layout's child.
   */
  const isChildOfLayout = dragParent === layoutId;
  /**
   * boolean to indicate if the widget is being dragged on this particular canvas.
   */
  const isCurrentDraggedCanvas = dragDetails.draggedOn === layoutId;
  /**
   * boolean to indicate if this canvas is the initial target canvas(Main Canvas) to activate when a new widget is dragged.
   */
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && layoutId === mainCanvasLayoutId;
  /**
   * boolean to indicate if the widgets being dragged are all allowed to drop in this particular canvas.
   * ex: In a From widget the header will not accept widgets like Table/List.
   */
  const allowToDrop =
    isDragging &&
    checkIfWidgetTypeDraggedIsAllowedToDrop(
      allowedWidgetTypes,
      isNewWidget,
      dragDetails,
      selectedWidgets,
      allWidgets,
    );
  // process drag blocks only once and per first render
  // this is by taking advantage of the fact that isNewWidget and dragDetails are unchanged states during the dragging action.
  const draggedBlocks = useMemo(
    () =>
      isDragging
        ? getDraggedBlocks(
            isNewWidget,
            dragDetails,
            selectedWidgets,
            allWidgets,
          )
        : [],
    [isDragging, selectedWidgets],
  );
  /**
   * boolean that indicates if the widget being dragged in an overlay widget like the Modal widget.
   */
  const activateOverlayWidgetDrop =
    isNewWidget && AnvilOverlayWidgetTypes.includes(newWidget.type);
  return {
    activateOverlayWidgetDrop,
    allowToDrop,
    draggedBlocks,
    dragDetails,
    selectedWidgets,
    isChildOfLayout,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    mainCanvasLayoutId,
    layoutElementPositions,
  };
};
