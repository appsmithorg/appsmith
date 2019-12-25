import React, { useContext, useState, memo } from "react";
import { ResizeDirection } from "re-resizable";
import { XYCoord } from "react-dnd";
import { getAbsolutePixels } from "utils/helpers";
import { WidgetOperations, WidgetRowCols } from "widgets/BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { FocusContext, ResizingContext } from "pages/Editor/Canvas";
import { DraggableComponentContext } from "./DraggableComponent";
import { generateClassName } from "utils/generators";

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
  const { isDragging, widgetNode } = useContext(DraggableComponentContext);
  const { setIsResizing } = useContext(ResizingContext);
  const { updateWidget, occupiedSpaces } = useContext(EditorContext);
  const { showPropertyPane, isFocused, setFocus } = useContext(FocusContext);
  const occupiedSpacesBySiblingWidgets =
    occupiedSpaces && props.parentId && occupiedSpaces[props.parentId]
      ? occupiedSpaces[props.parentId]
      : undefined;
  // Use state flag - isColliding - use to figure out if resize is possible at the current size.
  const [isColliding, setIsColliding] = useState(false);

  // isFocused (string | boolean) -> isWidgetFocused (boolean)
  const isWidgetFocused = isFocused === props.widgetId;

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
    const isResizePossible = !hasCollision(
      delta,
      position,
      props,
      occupiedSpacesBySiblingWidgets,
    );
    if (isResizePossible === isColliding) {
      setIsColliding(!isColliding);
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
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, newRowCols);
    }

    // Tell the Canvas that we've stopped resizing
    setIsResizing && setIsResizing(false);
    // Tell the Canvas to put the focus back to this widget
    // By setting the focus, we enable the control buttons on the widget
    setFocus && setFocus(props.widgetId);
    // Let the propertypane show.
    // The propertypane decides whether to show itself, based on
    // whether it was showing when the widget resize started.
    showPropertyPane && showPropertyPane(props.widgetId, widgetNode);
  };
  const style = getBorderStyles(
    isWidgetFocused,
    isColliding,
    props.paddingOffset,
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
      onResizeStart={() => {
        setIsResizing && setIsResizing(true);
        showPropertyPane && showPropertyPane(props.widgetId);
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
