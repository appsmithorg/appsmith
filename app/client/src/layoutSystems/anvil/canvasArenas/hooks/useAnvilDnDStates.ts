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
import WidgetFactory from "WidgetProvider/factory";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { areWidgetsWhitelisted } from "layoutSystems/anvil/utils/layouts/whitelistUtils";
import type {
  AnvilDragMeta,
  AnvilDropTargetType,
  DraggedWidgetTypes,
} from "../types";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { SectionWidget } from "widgets/anvil/SectionWidget";

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
  selectedWidgets: string[];
  isChildOfLayout: boolean;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isMainCanvas: boolean;
  isSection: boolean;
  isNewWidget: boolean;
  isNewWidgetInitialTargetCanvas: boolean;
  layoutElementPositions: LayoutElementPositions;
  dragMeta: AnvilDragMeta;
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
        parentId: newWidget.parentId,
        responsiveBehavior:
          newWidget.responsiveBehavior ??
          WidgetFactory.getConfig(newWidget.type)?.responsiveBehavior,
        type: newWidget.type,
        widgetId: newWidget.widgetId,
      },
    ];
  } else {
    return selectedWidgets.map((eachWidgetId) => ({
      parentId: allWidgets[eachWidgetId].parentId,
      responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
      type: allWidgets[eachWidgetId].type,
      widgetId: eachWidgetId,
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
  const isMainCanvas: boolean = layoutId === mainCanvasLayoutId;
  const isSection: boolean = layoutType === LayoutComponentTypes.SECTION;
  const extractWidgetTypesDragged: string[] = draggedBlocks.reduce(
    (widgetTypesArray, each) => {
      if (!widgetTypesArray.includes(each.type)) {
        widgetTypesArray.push(each.type);
      }
      return widgetTypesArray;
    },
    [] as string[],
  );
  const draggedWidgetTypes: DraggedWidgetTypes =
    extractWidgetTypesDragged.length > 1
      ? "WIDGETS"
      : extractWidgetTypesDragged[0] === ZoneWidget.type
      ? "ZONE"
      : extractWidgetTypesDragged[0] === SectionWidget.type
      ? "SECTION"
      : "WIDGETS";
  const draggedOn: AnvilDropTargetType = isMainCanvas
    ? "MAIN_CANVAS"
    : isSection
    ? "SECTION"
    : "ZONE";

  return {
    activateOverlayWidgetDrop,
    allowToDrop,
    draggedBlocks,
    dragDetails,
    dragMeta: {
      draggedWidgetTypes,
      draggedOn,
    },
    selectedWidgets,
    isChildOfLayout,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isMainCanvas,
    isSection,
    isNewWidgetInitialTargetCanvas,
    mainCanvasLayoutId,
    layoutElementPositions,
  };
};
