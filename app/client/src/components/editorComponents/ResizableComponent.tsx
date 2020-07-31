import React, { useContext, useRef, memo } from "react";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "widgets/ContainerWidget";

import {
  WidgetOperations,
  WidgetRowCols,
  WidgetProps,
} from "widgets/BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { generateClassName } from "utils/generators";
import { DropTargetContext } from "./DropTargetComponent";
import {
  UIElementSize,
  computeFinalRowCols,
  computeRowCols,
} from "./ResizableUtils";
import {
  useShowPropertyPane,
  useWidgetSelection,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import Resizable from "resizable";
import { isDropZoneOccupied, getSnapColumns } from "utils/WidgetPropsUtils";
import {
  VisibilityContainer,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
  BottomHandleStyles,
  TopLeftHandleStyles,
  TopRightHandleStyles,
  BottomLeftHandleStyles,
  BottomRightHandleStyles,
} from "./ResizeStyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { scrollElementIntoParentCanvasView } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";

export type ResizableComponentProps = ContainerWidgetProps<WidgetProps> & {
  paddingOffset: number;
};

/* eslint-disable react/display-name */
export const ResizableComponent = memo((props: ResizableComponentProps) => {
  const resizableRef = useRef<HTMLDivElement>(null);
  // Fetch information from the context
  const { updateWidget, occupiedSpaces } = useContext(EditorContext);
  const { updateDropTargetRows, persistDropTargetRows } = useContext(
    DropTargetContext,
  );

  const showPropertyPane = useShowPropertyPane();
  const { selectWidget } = useWidgetSelection();
  const { setIsResizing } = useWidgetDragResize();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const occupiedSpacesBySiblingWidgets =
    occupiedSpaces && props.parentId && occupiedSpaces[props.parentId]
      ? occupiedSpaces[props.parentId]
      : undefined;

  // isFocused (string | boolean) -> isWidgetFocused (boolean)
  const isWidgetFocused =
    focusedWidget === props.widgetId || selectedWidget === props.widgetId;

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  const dimensions: UIElementSize = {
    width:
      (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
      2 * props.paddingOffset,
    height:
      (props.bottomRow - props.topRow) * props.parentRowSpace -
      2 * props.paddingOffset,
  };

  // Resize bound's className - defaults to body
  // ResizableContainer accepts the className of the element,
  // whose clientRect will act as the bounds for resizing.
  // Note, if there are many containers with the same className
  // the bounding container becomes the nearest parent with the className
  const boundingElementClassName = generateClassName(props.parentId);
  const possibleBoundingElements = document.getElementsByClassName(
    boundingElementClassName,
  );
  const boundingElement =
    possibleBoundingElements.length > 0
      ? possibleBoundingElements[0]
      : undefined;
  const boundingElementClientRect = boundingElement
    ? boundingElement.getBoundingClientRect()
    : undefined;

  // onResize handler
  // Checks if the current resize position has any collisions
  // If yes, set isColliding flag to true.
  // If no, set isColliding flag to false.
  const isColliding = (newDimensions: UIElementSize, position: XYCoord) => {
    const bottom =
      props.topRow +
      position.y / props.parentRowSpace +
      newDimensions.height / props.parentRowSpace;
    // Make sure to calculate collision IF we don't update the main container's rows
    let updated = false;
    if (updateDropTargetRows) {
      updated = updateDropTargetRows(props.widgetId, bottom);
      const el = resizableRef.current;
      const scrollParent = getNearestParentCanvas(resizableRef.current);
      scrollElementIntoParentCanvasView(el, scrollParent);
    }

    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };
    const newRowCols: WidgetRowCols | false = computeRowCols(
      delta,
      position,
      props,
    );

    if (newRowCols.rightColumn > getSnapColumns()) {
      return true;
    }

    if (
      newRowCols.rightColumn - newRowCols.leftColumn < 1 ||
      newRowCols.bottomRow - newRowCols.topRow < 1
    ) {
      return true;
    }

    if (
      boundingElementClientRect &&
      newRowCols.rightColumn * props.parentColumnSpace >
        boundingElementClientRect.width
    ) {
      return true;
    }

    if (newRowCols && newRowCols.leftColumn < 0) {
      return true;
    }

    if (!updated) {
      if (
        boundingElementClientRect &&
        newRowCols.bottomRow * props.parentRowSpace >
          boundingElementClientRect.height
      ) {
        return true;
      }

      if (newRowCols && newRowCols.topRow < 0) {
        return true;
      }
    }
    // Check if new row cols are occupied by sibling widgets
    return isDropZoneOccupied(
      {
        left: newRowCols.leftColumn,
        top: newRowCols.topRow,
        bottom: newRowCols.bottomRow,
        right: newRowCols.rightColumn,
      },
      props.widgetId,
      occupiedSpacesBySiblingWidgets,
    );
  };

  // onResizeStop handler
  // when done resizing, check if;
  // 1) There is no collision
  // 2) There is a change in widget size
  // Update widget, if both of the above are true.
  const updateSize = (newDimensions: UIElementSize, position: XYCoord) => {
    // Get the difference in size of the widget, before and after resizing.
    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };

    // Get the updated Widget rows and columns props
    // False, if there is collision
    // False, if none of the rows and cols have changed.
    const newRowCols: WidgetRowCols | false = computeFinalRowCols(
      delta,
      position,
      props,
    );

    if (newRowCols) {
      persistDropTargetRows &&
        persistDropTargetRows(props.widgetId, newRowCols.bottomRow);
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, newRowCols);
    }
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsResizing && setIsResizing(false);
    }, 0);
    // Tell the Canvas to put the focus back to this widget
    // By setting the focus, we enable the control buttons on the widget
    selectWidget &&
      selectedWidget !== props.widgetId &&
      selectWidget(props.widgetId);
    // Let the propertypane show.
    // The propertypane decides whether to show itself, based on
    // whether it was showing when the widget resize started.
    showPropertyPane && showPropertyPane(props.widgetId, true);

    AnalyticsUtil.logEvent("WIDGET_RESIZE_END", {
      widgetName: props.widgetName,
      widgetType: props.type,
      startHeight: dimensions.height,
      startWidth: dimensions.width,
      endHeight: newDimensions.height,
      endWidth: newDimensions.width,
    });
  };

  const handleResizeStart = () => {
    setIsResizing && !isResizing && setIsResizing(true);
    selectWidget &&
      selectedWidget !== props.widgetId &&
      selectWidget(props.widgetId);
    showPropertyPane && showPropertyPane(props.widgetId, true);
    AnalyticsUtil.logEvent("WIDGET_RESIZE_START", {
      widgetName: props.widgetName,
      widgetType: props.type,
    });
  };

  return (
    <Resizable
      ref={resizableRef}
      handles={{
        left: LeftHandleStyles,
        top: TopHandleStyles,
        bottom: BottomHandleStyles,
        right: RightHandleStyles,
        bottomRight: BottomRightHandleStyles,
        topLeft: TopLeftHandleStyles,
        topRight: TopRightHandleStyles,
        bottomLeft: BottomLeftHandleStyles,
      }}
      componentHeight={dimensions.height}
      componentWidth={dimensions.width}
      onStart={handleResizeStart}
      onStop={updateSize}
      snapGrid={{ x: props.parentColumnSpace, y: props.parentRowSpace }}
      enable={!isDragging && isWidgetFocused}
      isColliding={isColliding}
    >
      <VisibilityContainer
        visible={!!props.isVisible}
        padding={props.paddingOffset}
      >
        {props.children}
      </VisibilityContainer>
    </Resizable>
  );
});

export default ResizableComponent;
