import React, { useContext, useState, memo } from "react";
import { ResizeDirection } from "re-resizable";
import { XYCoord } from "react-dnd";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getAbsolutePixels } from "utils/helpers";
import { WidgetOperations, WidgetRowCols } from "widgets/BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { FocusContext, DragResizeContext } from "pages/Editor/CanvasContexts";
import { generateClassName } from "utils/generators";
import { DropTargetContext } from "./DropTargetComponent";
import ResizableContainer, {
  ResizeBorderDotDiv,
  ResizableComponentProps,
} from "./ResizableContainer";
import {
  UIElementSize,
  getHandleSyles,
  computeUpdatedRowCols,
  hasCollision,
  getBorderStyles,
} from "./ResizableUtils";

/* eslint-disable react/display-name */
export const ResizableComponent = memo((props: ResizableComponentProps) => {
  // Fetch information from the context
  const { isDragging, setIsResizing } = useContext(DragResizeContext);
  const { updateWidget, occupiedSpaces } = useContext(EditorContext);
  const { updateDropTargetRows, persistDropTargetRows } = useContext(
    DropTargetContext,
  );
  const {
    showPropertyPane,
    selectedWidget,
    focusedWidget,
    selectWidget,
  } = useContext(FocusContext);
  const occupiedSpacesBySiblingWidgets =
    occupiedSpaces && props.parentId && occupiedSpaces[props.parentId]
      ? occupiedSpaces[props.parentId]
      : undefined;
  // Use state flag - isColliding - use to figure out if resize is possible at the current size.
  const [isColliding, setIsColliding] = useState(false);

  // isFocused (string | boolean) -> isWidgetFocused (boolean)
  const isWidgetFocused =
    focusedWidget === props.widgetId || selectedWidget === props.widgetId;

  // Widget can be resized if
  // The widget is focused, and
  // There is no drag event in progress on a widget.
  const canResize = !isDragging && isWidgetFocused;

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  const dimensions: UIElementSize = {
    width: (props.rightColumn - props.leftColumn) * props.parentColumnSpace,
    height: (props.bottomRow - props.topRow) * props.parentRowSpace,
  };

  // Resize bound's className - defaults to body
  // ResizableContainer accepts the className of the element,
  // whose clientRect will act as the bounds for resizing.
  // Note, if there are many containers with the same className
  // the bounding container becomes the nearest parent with the className
  let bounds = "body";
  bounds = "." + generateClassName(props.parentId);

  // onResize handler
  // Checks if the current resize position has any collisions
  // If yes, set isColliding flag to true.
  // If no, set isColliding flag to false.
  const checkForCollision = (
    e: MouseEvent,
    dir: ResizeDirection,
    ref: HTMLDivElement,
    delta: UIElementSize,
    position: XYCoord,
  ) => {
    const bottom =
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace;

    // Make sure to calculate collision IF we don't update the main container's rows
    let updated = false;
    if (updateDropTargetRows && props.parentId === MAIN_CONTAINER_WIDGET_ID)
      updated = updateDropTargetRows(bottom);

    if (!updated) {
      const isResizePossible = !hasCollision(
        delta,
        position,
        props,
        occupiedSpacesBySiblingWidgets,
      );
      if (isResizePossible === isColliding) {
        setIsColliding(!isColliding);
      }
    }
  };

  // onResizeStop handler
  // when done resizing, check if;
  // 1) There is no collision
  // 2) There is a change in widget size
  // Update widget, if both of the above are true.
  const updateSize = (
    e: MouseEvent,
    dir: ResizeDirection,
    ref: HTMLDivElement,
    d: UIElementSize,
    position: XYCoord,
  ) => {
    // Get the difference in size of the widget, before and after resizing.
    const delta: UIElementSize = {
      height: getAbsolutePixels(ref.style.height) - dimensions.height,
      width: getAbsolutePixels(ref.style.width) - dimensions.width,
    };

    // Get the updated Widget rows and columns props
    // False, if there is collision
    // False, if none of the rows and cols have changed.
    const newRowCols: WidgetRowCols | false = computeUpdatedRowCols(
      isColliding,
      delta,
      position,
      props,
    );

    if (newRowCols) {
      persistDropTargetRows &&
        props.parentId === MAIN_CONTAINER_WIDGET_ID &&
        persistDropTargetRows(props.widgetId, newRowCols.bottomRow);
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, newRowCols);
    }
    // Clear border styles
    setIsColliding && setIsColliding(false);
    // Tell the Canvas that we've stopped resizing
    setTimeout(() => {
      setIsResizing && setIsResizing(false);
    }, 300);
    // Tell the Canvas to put the focus back to this widget
    // By setting the focus, we enable the control buttons on the widget
    selectWidget && selectWidget(props.widgetId);
    // Let the propertypane show.
    // The propertypane decides whether to show itself, based on
    // whether it was showing when the widget resize started.
    showPropertyPane && showPropertyPane(props.widgetId, true);
  };
  const style = getBorderStyles(
    isWidgetFocused,
    isColliding,
    props.paddingOffset - 2,
  );
  return (
    <ResizableContainer
      isfocused={isWidgetFocused ? "true" : undefined}
      position={{
        x: 0,
        y: 0,
      }}
      size={dimensions}
      disableDragging
      minWidth={props.parentColumnSpace}
      minHeight={props.parentRowSpace}
      style={style}
      onResizeStop={updateSize}
      onResize={checkForCollision}
      onResizeStart={(e: any) => {
        setIsResizing && setIsResizing(true);
        selectWidget && selectWidget(props.widgetId);
        showPropertyPane && showPropertyPane(undefined, true);
      }}
      resizeGrid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={bounds}
      resizeHandleStyles={getHandleSyles()}
      enableResizing={{
        top: canResize,
        right: canResize,
        bottom: canResize,
        left: canResize,
        topRight: canResize,
        topLeft: canResize,
        bottomRight: canResize,
        bottomLeft: canResize,
      }}
    >
      <ResizeBorderDotDiv isfocused={isWidgetFocused}>
        {props.children}
      </ResizeBorderDotDiv>
    </ResizableContainer>
  );
});

export default ResizableComponent;
