import React, {
  ReactNode,
  Context,
  createContext,
  memo,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import styled from "styled-components";
import equal from "fast-deep-equal/es6";
import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import {
  MAIN_CONTAINER_WIDGET_ID,
  GridDefaults,
} from "constants/WidgetConstants";
import { calculateDropTargetRows } from "./DropTargetUtils";
import DragLayerComponent from "./DragLayerComponent";
import { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import {
  useShowPropertyPane,
  useCanvasSnapRowsUpdateHook,
} from "utils/hooks/dragResizeHooks";
import {
  getOccupiedSpacesSelectorForContainer,
  previewModeSelector,
} from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getDragDetails } from "sagas/selectors";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";

type DropTargetComponentProps = WidgetProps & {
  children?: ReactNode;
  snapColumnSpace: number;
  snapRowSpace: number;
  minHeight: number;
  noPad?: boolean;
};

const StyledDropTarget = styled.div`
  transition: height 100ms ease-in;
  width: 100%;
  position: relative;
  background: none;
  user-select: none;
  z-index: 1;
`;

function Onboarding() {
  return (
    <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
      Drag and drop a widget here
    </h2>
  );
}

/*
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (
    widgetIdsToExclude: string[],
    widgetBottomRow: number,
  ) => number | false;
}> = createContext({});

/**
 * Gets the dropTarget height
 * @param canDropTargetExtend boolean: Can we put widgets below the scrollview in this canvas?
 * @param isPreviewMode boolean: Are we in the preview mode
 * @param currentHeight number: Current height in the ref and what we have set in the dropTarget
 * @param snapRowSpace number: This is a static value actually, GridDefaults.DEFAULT_GRID_ROW_HEIGHT
 * @param minHeight number: The minHeight we've set to the widget in the reducer
 * @returns number: A new height style to set in the dropTarget.
 */
function getDropTargetHeight(
  canDropTargetExtend: boolean,
  isPreviewMode: boolean,
  currentHeight: number,
  snapRowSpace: number,
  minHeight: number,
) {
  let height = canDropTargetExtend
    ? `${Math.max(currentHeight * snapRowSpace, minHeight)}px`
    : "100%";
  if (isPreviewMode && canDropTargetExtend)
    height = `${currentHeight * snapRowSpace}px`;
  return height;
}

export function DropTargetComponent(props: DropTargetComponentProps) {
  // Get if this is in preview mode.
  const isPreviewMode = useSelector(previewModeSelector);
  // Pretty much the shouldScrollContents from the parent container like widget
  const canDropTargetExtend = props.canExtend;
  // If in preview mode, we don't need that extra row
  // This gives us the number of rows
  const snapRows = getCanvasSnapRows(
    props.bottomRow,
    props.canExtend && !isPreviewMode,
  );

  // Are we currently resizing?
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  // Are we currently dragging?
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  // Are we changing the auto height limits by dragging the signifiers?
  const { isAutoHeightWithLimitsChanging } = useAutoHeightUIState();

  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails = useSelector(getDragDetails);

  const { draggedOn } = dragDetails;

  // All the widgets in this canvas
  const childWidgets: string[] | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId]?.children,
  );

  // The occupied spaces in this canvas. It is a data structure which has the rect values of each child.
  const selectOccupiedSpaces = useCallback(
    getOccupiedSpacesSelectorForContainer(props.widgetId),
    [props.widgetId],
  );

  // Call the selector above.
  const occupiedSpacesByChildren = useSelector(selectOccupiedSpaces, equal);

  // Put the existing snap rows in a ref.
  const rowRef = useRef(snapRows);

  // This shows the property pane
  const showPropertyPane = useShowPropertyPane();

  const { deselectAll, focusWidget } = useWidgetSelection();

  // This updates the bottomRow of this canvas, as simple as that
  // This also doesn't cause an eval as it uses the action which is
  // not registered to cause an eval
  const updateCanvasSnapRows = useCanvasSnapRowsUpdateHook();

  // Everytime we get a new bottomRow, or we toggle shouldScrollContents
  // we call this effect
  useEffect(() => {
    const snapRows = getCanvasSnapRows(
      props.bottomRow,
      props.canExtend && !isPreviewMode,
    );
    // If the current ref is not set to the new snaprows we've received (based on bottomRow)
    if (rowRef.current !== snapRows) {
      rowRef.current = snapRows;
      // This sets the "height" property of the dropTarget div
      // This makes the div change heights if new heights are different
      updateHeight();
      // This sets the new rows in the reducer
      // Not sure why, as we've just received the values from the props.
      // seems like a potential way to cause recursive renders
      // See this: https://github.com/appsmithorg/appsmith/pull/18457#issuecomment-1327615572
      if (canDropTargetExtend && !isPreviewMode) {
        updateCanvasSnapRows(props.widgetId, snapRows);
      }
    }
  }, [props.bottomRow, props.canExtend, isPreviewMode]);

  // If we've stopped dragging, resizing or changing auto height limits
  useEffect(() => {
    if (!isDragging || !isResizing || !isAutoHeightWithLimitsChanging) {
      // bottom row of canvas can increase by any number as user moves/resizes any widget towards the bottom of the canvas
      // but canvas height is not lost when user moves/resizes back top.
      // it is done that way to have a pleasant building experience.
      // post drop the bottom most row is used to appropriately calculate the canvas height and lose unwanted height.
      rowRef.current = snapRows;
      updateHeight();
    }
  }, [isDragging, isResizing, isAutoHeightWithLimitsChanging]);

  // Update the drop target height style directly.
  const updateHeight = () => {
    if (dropTargetRef.current) {
      const height = getDropTargetHeight(
        canDropTargetExtend,
        isPreviewMode,
        rowRef.current,
        props.snapRowSpace,
        props.minHeight,
      );

      dropTargetRef.current.style.height = height;
    }
  };

  const handleFocus = (e: any) => {
    // Making sure that we don't deselect the widget
    // after we are done dragging the limits in auto height with limits
    if (!isResizing && !isDragging && !isAutoHeightWithLimitsChanging) {
      if (!props.parentId) {
        deselectAll();
        focusWidget && focusWidget(props.widgetId);
        showPropertyPane && showPropertyPane();
      }
    }
    e.preventDefault();
  };

  /** PREPARE CONTEXT */

  // Function which computes and updates the height of the dropTarget
  // This is used in a context and hence in one of the children of this dropTarget
  const updateDropTargetRows = (
    widgetIdsToExclude: string[],
    widgetBottomRow: number,
  ) => {
    if (canDropTargetExtend) {
      const newRows = calculateDropTargetRows(
        widgetIdsToExclude,
        widgetBottomRow,
        props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
        occupiedSpacesByChildren,
        props.widgetId,
      );
      if (rowRef.current < newRows) {
        rowRef.current = newRows;
        updateHeight();
        return newRows;
      }
      return false;
    }
    return false;
  };
  // memoizing context values
  const contextValue = useMemo(() => {
    return {
      updateDropTargetRows,
    };
  }, [updateDropTargetRows, occupiedSpacesByChildren]);

  /** EO PREPARE CONTEXT */

  const height = getDropTargetHeight(
    canDropTargetExtend,
    isPreviewMode,
    rowRef.current,
    props.snapRowSpace,
    props.minHeight,
  );

  const boxShadow =
    (isResizing || isDragging || isAutoHeightWithLimitsChanging) &&
    props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? "inset 0px 0px 0px 1px #DDDDDD"
      : "0px 0px 0px 1px transparent";

  const dropTargetStyles = {
    height,
    boxShadow,
  };

  const shouldOnboard =
    !(childWidgets && childWidgets.length) && !isDragging && !props.parentId;

  // The drag layer is the one with the grid dots.
  // They need to show in certain scenarios
  const showDragLayer =
    ((isDragging && draggedOn === props.widgetId) ||
      isResizing ||
      isAutoHeightWithLimitsChanging) &&
    !isPreviewMode;

  const dropTargetRef = useRef<HTMLDivElement>(null);

  return (
    <DropTargetContext.Provider value={contextValue}>
      <StyledDropTarget
        className="t--drop-target"
        onClick={handleFocus}
        ref={dropTargetRef}
        style={dropTargetStyles}
      >
        {props.children}
        {shouldOnboard && <Onboarding />}
        {showDragLayer && (
          <DragLayerComponent
            noPad={props.noPad || false}
            parentColumnWidth={props.snapColumnSpace}
            parentRowHeight={props.snapRowSpace}
          />
        )}
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
}

const MemoizedDropTargetComponent = memo(DropTargetComponent);

export default MemoizedDropTargetComponent;
