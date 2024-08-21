import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { getSelectedWidgets } from "selectors/ui";
import {
  type DraggedWidget,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { areWidgetsWhitelisted } from "layoutSystems/anvil/utils/layouts/whitelistUtils";
import { AnvilDropTargetTypesEnum, type AnvilDragMeta } from "../types";
import { canActivateCanvasForDraggedWidget } from "../utils/utils";
import { useAnvilDnDCompensators } from "./useAnvilDnDCompensators";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import type { AnvilGlobalDnDStates } from "../../canvas/hooks/useAnvilGlobalDnDStates";
import { getWidgets } from "sagas/selectors";
import { useMemo } from "react";
import { WDSZoneWidget } from "widgets/wds/WDSZoneWidget";
import { useAnvilWidgetElevation } from "../../canvas/providers/AnvilWidgetElevationProvider";

interface AnvilDnDListenerStatesProps {
  anvilGlobalDragStates: AnvilGlobalDnDStates;
  allowedWidgetTypes: string[];
  widgetId: string;
  layoutId: string;
  layoutType: LayoutComponentTypes;
}
export interface AnvilDnDListenerStates {
  activateOverlayWidgetDrop: boolean;
  allowToDrop: boolean;
  canActivate: boolean;
  currentWidgetHierarchy: number;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  dragMeta: AnvilDragMeta;
  mainCanvasLayoutId: string;
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

export const useAnvilDnDListenerStates = ({
  allowedWidgetTypes,
  anvilGlobalDragStates,
  layoutId,
  layoutType,
  widgetId,
}: AnvilDnDListenerStatesProps): AnvilDnDListenerStates => {
  const {
    activateOverlayWidgetDrop,
    dragDetails,
    draggedBlocks,
    draggedWidgetHierarchy,
    draggedWidgetTypes,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilGlobalDragStates;
  const allWidgets = useSelector(getWidgets);
  const anvilWidgetElevation = useAnvilWidgetElevation();
  const elevatedWidgets = anvilWidgetElevation?.elevatedWidgets || {};
  const widgetProps = allWidgets[widgetId];
  const selectedWidgets = useSelector(getSelectedWidgets);
  /**
   * boolean to indicate if the widget is being dragged on this particular canvas.
   */
  const currentWidgetHierarchy = getWidgetHierarchy(widgetProps.type, widgetId);
  const canActivate = canActivateCanvasForDraggedWidget(
    draggedWidgetHierarchy,
    widgetProps.widgetId,
    widgetProps.type,
  );
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
  const isMainCanvas: boolean = layoutId === mainCanvasLayoutId;
  const isSection: boolean = layoutType === LayoutComponentTypes.SECTION;
  const draggedOn = isMainCanvas
    ? AnvilDropTargetTypesEnum.MAIN_CANVAS
    : isSection
      ? AnvilDropTargetTypesEnum.SECTION
      : AnvilDropTargetTypesEnum.ZONE;
  const isEmptyLayout =
    (widgetProps.children || []).filter(
      (each) => !allWidgets[each].detachFromLayout,
    ).length === 0;

  const allSiblingsWidgetIds = useMemo(() => {
    return (
      (widgetProps.parentId && allWidgets[widgetProps.parentId]?.children) || []
    );
  }, [widgetProps, allWidgets]);

  const isElevatedWidget = useMemo(() => {
    if (widgetProps.type === WDSZoneWidget.type) {
      const isAnyZoneElevated = allSiblingsWidgetIds.some(
        (each) => !!elevatedWidgets[each],
      );
      return isAnyZoneElevated;
    }
    return !!elevatedWidgets[widgetId];
  }, [widgetProps, elevatedWidgets, allSiblingsWidgetIds]);

  const {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
    zIndex,
  } = useAnvilDnDCompensators(
    canActivate,
    draggedWidgetHierarchy,
    currentWidgetHierarchy,
    isEmptyLayout,
    isElevatedWidget,
  );

  return {
    activateOverlayWidgetDrop,
    allowToDrop,
    canActivate,
    currentWidgetHierarchy,
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
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
    zIndex,
  };
};
