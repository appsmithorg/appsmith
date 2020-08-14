import React, { CSSProperties } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import {
  useWidgetSelection,
  useShowPropertyPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";

const DraggableWrapper = styled.div`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: grab;
`;

// Widget Boundaries which is shown to indicate the boundaries of the widget
const WidgetBoundaries = styled.div`
  transform: translate3d(-${WIDGET_PADDING + 1}px, -${WIDGET_PADDING + 1}px, 0);
  z-index: 0;
  width: calc(100% + ${WIDGET_PADDING - 2}px);
  height: calc(100% + ${WIDGET_PADDING - 2}px);
  position: absolute;
  border: 1px dashed
    ${props => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  pointer-events: none;
`;

type DraggableComponentProps = ContainerWidgetProps<WidgetProps>;

/* eslint-disable react/display-name */

const DraggableComponent = (props: DraggableComponentProps) => {
  // Dispatch hook handy to toggle property pane
  const showPropertyPane = useShowPropertyPane();

  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget, focusWidget } = useWidgetSelection();

  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setIsDragging } = useWidgetDragResize();

  // This state tells us which widget is selected
  // The value is the widgetId of the selected widget
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );

  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  const [{ isCurrentWidgetDragging }, drag] = useDrag({
    item: props as WidgetProps,
    collect: (monitor: DragSourceMonitor) => ({
      isCurrentWidgetDragging: monitor.isDragging(),
    }),
    begin: () => {
      // When this draggable starts dragging

      // Remove property pane by passing undefined for the widgetId
      // The second parameter is true to make sure the next call (at drop)
      // takes the current state of the property pane toggle state (open/close)
      // into account.
      showPropertyPane && showPropertyPane(undefined, true);

      // Make sure that this widget is selected
      selectWidget &&
        selectedWidget !== props.widgetId &&
        selectWidget(props.widgetId);

      // Tell the rest of the application that a widget has started dragging
      setIsDragging && setIsDragging(true);

      AnalyticsUtil.logEvent("WIDGET_DRAG", {
        widgetName: props.widgetName,
        widgetType: props.type,
      });
    },
    end: (widget, monitor) => {
      // When this draggable is dropped, we try to open the propertypane
      // We pass the second parameter to make sure the previous toggle state (open/close)
      // of the property pane is taken into account.
      // See utils/hooks/dragResizeHooks.tsx
      const didDrop = monitor.didDrop();
      if (didDrop) {
        showPropertyPane && showPropertyPane(props.widgetId, true);
      }
      // Take this to the bottom of the stack. So that it runs last.
      // We do this because, we don't want erroraneous mouse clicks to propagate.
      setTimeout(() => setIsDragging && setIsDragging(false), 0);
      AnalyticsUtil.logEvent("WIDGET_DROP", {
        widgetName: props.widgetName,
        widgetType: props.type,
        didDrop: didDrop,
      });
    },
    canDrag: () => {
      // Dont' allow drag if we're resizing or the drag of `DraggableComponent` is disabled
      return !isResizing && !isDraggingDisabled;
    },
  });

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;

  // When the draggable is clicked
  const handleClick = (e: any) => {
    if (!isResizingOrDragging) {
      selectWidget &&
        selectedWidget !== props.widgetId &&
        selectWidget(props.widgetId);
      selectedWidget !== props.widgetId &&
        showPropertyPane &&
        showPropertyPane();
    }
    e.stopPropagation();
  };

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      focusedWidget !== props.widgetId &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };

  // Display this draggable based on the current drag state
  const style: CSSProperties = {
    display: isCurrentWidgetDragging ? "none" : "flex",
  };

  // WidgetBoundaries
  const widgetBoundaries = (
    <WidgetBoundaries
      style={{
        opacity:
          isResizingOrDragging && selectedWidget !== props.widgetId ? 1 : 0,
      }}
    />
  );

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const className = `${classNameForTesting}`;

  return (
    <DraggableWrapper
      className={className}
      ref={drag}
      onMouseOver={handleMouseOver}
      onClick={handleClick}
      style={style}
    >
      {props.children}
      {widgetBoundaries}
    </DraggableWrapper>
  );
};

export default DraggableComponent;
