import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { DefaultRootState } from "react-redux";
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
} from "../../canvasArenas/utils/utils";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";
import type { AnvilDraggedWidgetTypesEnum } from "../../canvasArenas/types";
import { useAnvilDnDDeactivation } from "./useAnvilDnDDeactivation";

export interface AnvilGlobalDnDStates {
  activateOverlayWidgetDrop: boolean;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  draggedWidgetHierarchy: number;
  draggedWidgetTypes: AnvilDraggedWidgetTypesEnum;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  mainCanvasLayoutId: string;
}

/**
 * This hook is used to get the global states of the canvas while dragging.
 * It also is responsible for deactivating the canvas while dragging.
 * @returns AnvilGlobalDnDStates
 */
export const useAnvilGlobalDnDStates = (): AnvilGlobalDnDStates => {
  const mainCanvasLayoutId: string = useSelector((state) =>
    getDropTargetLayoutId(state, MAIN_CONTAINER_WIDGET_ID),
  );
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const allWidgets = useSelector(getWidgets);
  const selectedWidgets = useSelector(getSelectedWidgets);

  /**
   * dragDetails is the state that holds the details of the widget being dragged.
   */
  const dragDetails: DragDetails = useSelector(getDragDetails);

  /**
   * isDragging is a boolean that indicates if a widget is being dragged.
   */
  const isDragging = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isDragging,
  );

  /**
   * dragParent is the parent of the widget being dragged.
   */
  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;

  /**
   * boolean to indicate if the widget being dragged is a new widget
   */
  const isNewWidget = !!newWidget && !dragParent;

  /**
   * compute drag blocks only once and per first render
   * this is by taking advantage of the fact that isNewWidget and dragDetails are unchanged states during the dragging action.
   */
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
   * boolean to indicate if the widget is being dragged on this particular canvas.
   */
  const draggedWidgetHierarchy = getDraggedWidgetHierarchy(draggedBlocks);

  /**
   * boolean that indicates if the widget being dragged in an overlay widget like the Modal widget.
   */
  const activateOverlayWidgetDrop =
    isNewWidget && newWidget.detachFromLayout === true;

  /**
   * get the dragged widget types to assess if the widget can be dropped on the canvas.
   */
  const draggedWidgetTypes = useMemo(
    () => getDraggedWidgetTypes(draggedBlocks),
    [draggedBlocks],
  );

  /**
   * This hook handles the deactivation of the canvas(Drop targets) while dragging.
   */
  useAnvilDnDDeactivation(isDragging, isNewWidget);

  return {
    activateOverlayWidgetDrop,
    draggedBlocks,
    draggedWidgetHierarchy,
    dragDetails,
    draggedWidgetTypes,
    isDragging,
    isNewWidget,
    mainCanvasLayoutId,
    layoutElementPositions,
  };
};
