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
import { getDraggedBlocks, getDraggedWidgetTypes } from "../utils/utils";
import { getCurrentlyOpenAnvilModal } from "layoutSystems/anvil/integrations/modalSelectors";
import { getAnvilCanvasId } from "layoutSystems/anvil/viewer/canvas/utils";

interface AnvilDnDStatesProps {
  allowedWidgetTypes: string[];
  widgetId: string;
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
  isSection: boolean;
  widgetCompensatorValues: {
    left: number;
    top: number;
  };
  edgeCompensatorValues: {
    left: number;
    top: number;
  };
  layoutCompensatorValues: {
    left: number;
    top: number;
  };
  zIndex: number;
}

const WidgetSpacing = {
  MAIN_CANVAS: "--outer-spacing-4",
  ZONE: "--outer-spacing-3",
};

const extractSpacingStyleValues = (mainCanvasDom: HTMLElement) => {
  const computedStyles = getComputedStyle(mainCanvasDom);

  return {
    mainCanvasSpacing: parseInt(
      computedStyles.getPropertyValue(WidgetSpacing.MAIN_CANVAS),
      10,
    ),
    zoneSpacing: parseInt(
      computedStyles.getPropertyValue(WidgetSpacing.ZONE),
      10,
    ),
  };
};

const getWidgetSpacingCSSVariableValues = () => {
  const mainCanvasDom = document.getElementById(
    getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID),
  );
  if (!mainCanvasDom) {
    return {
      mainCanvasSpacing: 0,
      zoneSpacing: 0,
    };
  }
  return extractSpacingStyleValues(mainCanvasDom);
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
  widgetId,
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
  const currentlyOpenModal = useSelector(getCurrentlyOpenAnvilModal);
  const isModalLayout = currentlyOpenModal === widgetId;

  const { mainCanvasSpacing, zoneSpacing } =
    getWidgetSpacingCSSVariableValues();
  const modalSpacing = mainCanvasSpacing;
  const widgetCompensatorValues = {
    left: isSection ? mainCanvasSpacing : 0,
    top: isModalLayout ? modalSpacing : 0,
  };

  const edgeCompensatorValues = {
    left: isMainCanvas ? 0 : isSection ? mainCanvasSpacing : zoneSpacing,
    top: isSection
      ? 0
      : isMainCanvas
      ? mainCanvasSpacing
      : isModalLayout
      ? modalSpacing * 0.5
      : zoneSpacing,
  };

  const layoutCompensatorValues = {
    left:
      isMainCanvas || isModalLayout
        ? 0
        : isSection
        ? mainCanvasSpacing
        : zoneSpacing,
    top: isSection
      ? 0
      : isMainCanvas
      ? 0
      : isModalLayout
      ? modalSpacing
      : zoneSpacing,
  };
  const zIndex = isSection || isModalLayout ? 0 : 1;
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
    isSection,
    mainCanvasLayoutId,
    layoutElementPositions,
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
    zIndex,
  };
};
