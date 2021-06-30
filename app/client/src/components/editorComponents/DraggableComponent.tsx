import React, { CSSProperties, useState } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import {
  useShowPropertyPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { commentModeSelector } from "selectors/commentsSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

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
    ${(props) => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  pointer-events: none;
`;

type DraggableComponentProps = WidgetProps;

/* eslint-disable react/display-name */

/**
 * can drag helper function for react-dnd hook
 *
 * @param isResizing
 * @param isDraggingDisabled
 * @param props
 * @returns
 */
export const canDrag = (
  isResizing: boolean,
  isDraggingDisabled: boolean,
  props: any,
  isCommentMode: boolean,
) => {
  return (
    !isResizing && !isDraggingDisabled && !props?.dragDisabled && !isCommentMode
  );
};

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to toggle property pane
  const showPropertyPane = useShowPropertyPane();

  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();

  const isCommentMode = useSelector(commentModeSelector);

  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDragItemsInitialParent, setIsDragging } = useWidgetDragResize();

  // This state tells us which widget is selected
  // The value is the widgetId of the selected widget
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );

  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
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

  const [{ isCurrentWidgetDragging }] = useDrag({
    item: props as WidgetProps,
    collect: (monitor: DragSourceMonitor) => ({
      isCurrentWidgetDragging: monitor.isDragging(),
    }),
    begin: () => {
      // When this draggable starts dragging

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
        showPropertyPane && showPropertyPane(props.widgetId, undefined, true);
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
      return canDrag(isResizing, isDraggingDisabled, props, isCommentMode);
    },
  });

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      focusedWidget !== props.widgetId &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };
  const shouldRenderComponent = !(
    selectedWidgets.includes(props.widgetId) && isDragging
  );
  // Display this draggable based on the current drag state
  const style: CSSProperties = {
    display: isCurrentWidgetDragging ? "none" : "block",
  };

  // WidgetBoundaries
  const widgetBoundaries = (
    <WidgetBoundaries
      style={{
        opacity:
          isResizingOrDragging && !selectedWidgets.includes(props.widgetId)
            ? 1
            : 0,
        position: "absolute",
        transform: `translate(-50%, -50%)`,
        top: "50%",
        left: "50%",
      }}
    />
  );

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;
  // const { setIsDragging } = useWidgetDragResize();

  const className = `${classNameForTesting}`;
  const dispatch = useDispatch();
  const [mightBeDragging, setMightBeDragging] = useState(false);
  const mouseMove = (e: any) => {
    if (mightBeDragging) {
      e.preventDefault();
      setDragItemsInitialParent(true, props.parentId || "", props.widgetId);
      if (!selectedWidgets.includes(props.widgetId)) {
        dispatch(selectWidgetInitAction(props.widgetId));
      }
      setMightBeDragging(false);
      e.stopPropagation();
    }
  };
  return (
    <DraggableWrapper
      className={className}
      onMouseDown={(e) => {
        setMightBeDragging(true);
        e.stopPropagation();
      }}
      onMouseMove={mouseMove}
      onMouseOver={handleMouseOver}
      onMouseUp={(e) => {
        setMightBeDragging(false);
        e.stopPropagation();
      }}
      style={style}
    >
      {shouldRenderComponent && props.children}
      {widgetBoundaries}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
