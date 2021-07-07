import React, { CSSProperties, useRef } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { commentModeSelector } from "selectors/commentsSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { useEffect } from "react";

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
 * @param isResizingOrDragging
 * @param isDraggingDisabled
 * @param props
 * @returns
 */
export const canDrag = (
  isResizingOrDragging: boolean,
  isDraggingDisabled: boolean,
  props: any,
  isCommentMode: boolean,
) => {
  return (
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !props?.dragDisabled &&
    !isCommentMode
  );
};

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget } = useWidgetSelection();

  const isCommentMode = useSelector(commentModeSelector);

  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingState } = useWidgetDragResize();

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

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const isCurrentWidgetDragging =
    isDragging && selectedWidgets.includes(props.widgetId);
  const isCurrentWidgetResizing =
    isResizing && selectedWidgets.includes(props.widgetId);
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
        opacity: !isResizingOrDragging || isCurrentWidgetResizing ? 0 : 1,
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

  const allowDrag = canDrag(
    isResizingOrDragging,
    isDraggingDisabled,
    props,
    isCommentMode,
  );
  const className = `${classNameForTesting}`;
  const dispatch = useDispatch();
  const mightBeDragging = useRef(false);
  const draggableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mightBeDragging.current = false;
  }, [isResizing]);

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggableRef.current && !e.metaKey) {
      if (!selectedWidgets.includes(props.widgetId)) {
        dispatch(selectWidgetInitAction(props.widgetId));
      }
      const bounds = draggableRef.current.getBoundingClientRect();
      const startPoints = {
        top: (e.clientY - bounds.top) / props.parentRowSpace,
        left: (e.clientX - bounds.left) / props.parentColumnSpace,
      };
      setDraggingState(true, props.parentId || "", props.widgetId, startPoints);
    }
  };

  return (
    <DraggableWrapper
      className={className}
      draggable={allowDrag}
      onDragStartCapture={onDragStart}
      onMouseOver={handleMouseOver}
      ref={draggableRef}
      style={style}
    >
      {shouldRenderComponent && props.children}
      {widgetBoundaries}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
