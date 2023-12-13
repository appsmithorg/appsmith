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
import type { DraggedWidgetTypes } from "../../types";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { getDraggedBlocks } from "../utils";

export interface AnvilCanvasActivationStates {
  activateOverlayWidgetDrop: boolean;
  dragDetails: DragDetails;
  draggedWidgetTypes: DraggedWidgetTypes;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  mainCanvasLayoutId: string;
  selectedWidgets: string[];
}

const AnvilOverlayWidgetTypes = ["MODAL_WIDGET"];

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
  const activateOverlayWidgetDrop =
    isNewWidget && AnvilOverlayWidgetTypes.includes(newWidget.type);
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

  return {
    activateOverlayWidgetDrop,
    dragDetails,
    draggedWidgetTypes,
    isDragging,
    isNewWidget,
    layoutElementPositions,
    mainCanvasLayoutId,
    selectedWidgets,
  };
};
