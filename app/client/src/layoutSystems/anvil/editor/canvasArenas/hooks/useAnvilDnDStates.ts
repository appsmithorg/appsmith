import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useMemo } from "react";
import { getSelectedWidgets } from "selectors/ui";
import {
  type DraggedWidget,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { getDropTargetLayoutId } from "layoutSystems/anvil/integrations/selectors";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { areWidgetsWhitelisted } from "layoutSystems/anvil/utils/layouts/whitelistUtils";
import { AnvilDropTargetTypesEnum, type AnvilDragMeta } from "../types";
import { getDraggedBlocks, getDraggedWidgetTypes } from "./utils";

interface AnvilDnDStatesProps {
  allowedWidgetTypes: string[];
  canvasId: string;
  layoutId: string;
  layoutType: LayoutComponentTypes;
}

export interface AnvilDnDStates {
  activateOverlayWidgetDrop: boolean;
  allowToDrop: boolean;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  dragMeta: AnvilDragMeta;
  mainCanvasLayoutId: string;
}

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
  let draggedWidgetTypes: string[] = [];
  if (isNewWidget) {
    const { newWidget } = dragDetails;
    draggedWidgetTypes.push(newWidget.type);
  } else {
    draggedWidgetTypes = selectedWidgets.map(
      (eachWidgetId) => allWidgets[eachWidgetId].type,
    );
  }
  return areWidgetsWhitelisted(draggedWidgetTypes, allowedWidgetTypes);
};

export const useAnvilDnDStates = ({
  allowedWidgetTypes,
  layoutId,
  layoutType,
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
  /**
   * boolean to indicate if the widget being dragged is a new widget
   */
  const isNewWidget = !!newWidget && !dragParent;
  /**
   * boolean to indicate if the widget is being dragged on this particular canvas.
   */
  const isCurrentDraggedCanvas = dragDetails.draggedOn === layoutId;
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
    isNewWidget && newWidget.detachFromLayout === true;
  const isMainCanvas: boolean = layoutId === mainCanvasLayoutId;
  const isSection: boolean = layoutType === LayoutComponentTypes.SECTION;
  const draggedWidgetTypes = useMemo(
    () => getDraggedWidgetTypes(draggedBlocks),
    [draggedBlocks],
  );
  const draggedOn = isMainCanvas
    ? AnvilDropTargetTypesEnum.MAIN_CANVAS
    : isSection
    ? AnvilDropTargetTypesEnum.SECTION
    : AnvilDropTargetTypesEnum.ZONE;

  return {
    activateOverlayWidgetDrop,
    allowToDrop,
    draggedBlocks,
    dragDetails,
    dragMeta: {
      draggedWidgetTypes,
      draggedOn,
    },
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    mainCanvasLayoutId,
    layoutElementPositions,
  };
};
