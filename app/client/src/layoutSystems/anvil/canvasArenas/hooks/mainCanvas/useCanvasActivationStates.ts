import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useMemo } from "react";
import { getSelectedWidgets } from "selectors/ui";
import { getDropTargetLayoutId } from "layoutSystems/anvil/integrations/selectors";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import {
  getDraggedBlocks,
  getDraggedWidgetHierarchy,
  getDraggedWidgetTypes,
} from "../utils";
import type { AnvilDraggedWidgetTypes } from "../../types";

export interface AnvilCanvasActivationStates {
  activateOverlayWidgetDrop: boolean;
  dragDetails: DragDetails;
  draggedWidgetHierarchy: number;
  draggedWidgetTypes: AnvilDraggedWidgetTypes;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  mainCanvasLayoutId: string;
  selectedWidgets: string[];
}

export const useCanvasActivationStates = (): AnvilCanvasActivationStates => {
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
  /**
   * boolean to indicate if the widget being dragged is a new widget
   */
  const isNewWidget = !!newWidget && !dragParent;
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
  const activateOverlayWidgetDrop = isNewWidget && !!newWidget.detachFromLayout;
  const draggedWidgetTypes = useMemo(
    () => getDraggedWidgetTypes(draggedBlocks),
    [draggedBlocks],
  );
  const draggedWidgetHierarchy = getDraggedWidgetHierarchy(draggedBlocks);

  return {
    activateOverlayWidgetDrop,
    dragDetails,
    draggedWidgetHierarchy,
    draggedWidgetTypes,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
    selectedWidgets,
  };
};
