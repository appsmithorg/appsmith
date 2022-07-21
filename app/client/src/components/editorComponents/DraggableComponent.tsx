import React, { CSSProperties, useMemo, useRef } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { commentModeSelector } from "selectors/commentsSelectors";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

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
  isSnipingMode: boolean,
  isPreviewMode: boolean,
) => {
  return (
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !props?.dragDisabled &&
    !isCommentMode &&
    !isSnipingMode &&
    !isPreviewMode
  );
};

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();

  const isCommentMode = useSelector(commentModeSelector);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingCanvas, setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();
  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
  );
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );
  const isCurrentWidgetFocused = focusedWidget === props.widgetId;
  const isCurrentWidgetSelected = selectedWidgets.includes(props.widgetId);

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
  const isCurrentWidgetDragging = isDragging && isCurrentWidgetSelected;
  const isCurrentWidgetResizing = isResizing && isCurrentWidgetSelected;
  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isCurrentWidgetFocused &&
      !props.resizeDisabled &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };
  const shouldRenderComponent = !(isCurrentWidgetSelected && isDragging);
  // Display this draggable based on the current drag state
  const dragWrapperStyle: CSSProperties = {
    display: isCurrentWidgetDragging ? "none" : "block",
  };
  const dragBoundariesStyle: React.CSSProperties = useMemo(() => {
    return {
      opacity: !isResizingOrDragging || isCurrentWidgetResizing ? 0 : 1,
      position: "absolute",
      transform: `translate(-50%, -50%)`,
      top: "50%",
      left: "50%",
    };
  }, [isResizingOrDragging, isCurrentWidgetResizing]);

  const widgetBoundaries = <WidgetBoundaries style={dragBoundariesStyle} />;

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const allowDrag = canDrag(
    isResizingOrDragging,
    isDraggingDisabled,
    props,
    isCommentMode,
    isSnipingMode,
    isPreviewMode,
  );
  const className = `${classNameForTesting}`;
  const draggableRef = useRef<HTMLDivElement>(null);

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    // allowDrag check is added as react jest test simulation is not respecting default behaviour
    // of draggable=false and triggering onDragStart. allowDrag condition check is purely for the test cases.
    if (allowDrag && draggableRef.current && !(e.metaKey || e.ctrlKey)) {
      if (!isCurrentWidgetFocused) return;

      if (!isCurrentWidgetSelected) {
        selectWidget(props.widgetId);
      }
      const widgetHeight = props.bottomRow - props.topRow;
      const widgetWidth = props.rightColumn - props.leftColumn;
      const bounds = draggableRef.current.getBoundingClientRect();
      const startPoints = {
        top: Math.min(
          Math.max((e.clientY - bounds.top) / props.parentRowSpace, 0),
          widgetHeight - 1,
        ),
        left: Math.min(
          Math.max((e.clientX - bounds.left) / props.parentColumnSpace, 0),
          widgetWidth - 1,
        ),
      };
      showTableFilterPane();
      setDraggingCanvas(props.parentId);

      setDraggingState({
        isDragging: true,
        dragGroupActualParent: props.parentId || "",
        draggingGroupCenter: { widgetId: props.widgetId },
        startPoints,
      });
    }
  };

  return (
    <DraggableWrapper
      className={className}
      data-testid={isCurrentWidgetSelected ? "t--selected" : ""}
      draggable={allowDrag}
      onDragStart={onDragStart}
      onMouseOver={handleMouseOver}
      ref={draggableRef}
      style={dragWrapperStyle}
    >
      {shouldRenderComponent && props.children}
      {widgetBoundaries}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
