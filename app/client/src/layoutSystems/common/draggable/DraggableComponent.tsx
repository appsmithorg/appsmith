import type { AppState } from "ee/reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { CSSProperties, DragEventHandler, ReactNode } from "react";
import React, { useMemo, useRef } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { isWidgetFocused, isWidgetSelected } from "selectors/widgetSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import type { SetDraggingStateActionPayload } from "utils/hooks/dragResizeHooks";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";

const DraggableWrapper = styled.div<{ draggable: boolean }>`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: ${(props) => (props.draggable ? "grab" : "unset")};
`;

export interface DraggableComponentProps {
  widgetId: string;
  parentId?: string;
  isFlexChild?: boolean;
  resizeDisabled?: boolean;
  type: string;
  children: ReactNode;
  generateDragState: (
    e: React.DragEvent,
    draggableRef: HTMLElement,
  ) => SetDraggingStateActionPayload;
  dragDisabled: boolean;
}

// Widget Boundaries which is shown to indicate the boundaries of the widget
const WidgetBoundaries = styled.div`
  z-index: 0;
  width: calc(100% + ${WIDGET_PADDING - 2}px);
  height: calc(100% + ${WIDGET_PADDING - 2}px);
  position: absolute;
  border: 1px dashed
    ${(props) => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  pointer-events: none;
  top: 0;
  left: 0;
`;

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as selected
  const { selectWidget } = useWidgetSelection();

  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();

  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isWidgetFocused(props.widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const isDraggingSibling = useSelector(
    (state) =>
      state.ui.widgetDragResize?.dragDetails?.draggedOn === props.parentId,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const isCurrentWidgetDragging = isDragging && isSelected;
  const isCurrentWidgetResizing = isResizing && isSelected;
  const showBoundary =
    !props.isFlexChild && (isCurrentWidgetDragging || isDraggingSibling);

  // Display this draggable based on the current drag state
  const dragWrapperStyle: CSSProperties = {
    display: !props.isFlexChild && isCurrentWidgetDragging ? "none" : "block",
  };
  const dragBoundariesStyle: React.CSSProperties = useMemo(() => {
    return {
      opacity: !isResizingOrDragging || isCurrentWidgetResizing ? 0 : 1,
    };
  }, [isResizingOrDragging, isCurrentWidgetResizing]);

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const allowDrag = !props.dragDisabled && shouldAllowDrag;
  const className = `${classNameForTesting}`;
  const draggableRef = useRef<HTMLDivElement>(null);
  const onDragStart: DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // allowDrag check is added as react jest test simulation is not respecting default behaviour
    // of draggable=false and triggering onDragStart. allowDrag condition check is purely for the test cases.
    if (allowDrag && draggableRef.current && !(e.metaKey || e.ctrlKey)) {
      if (!isFocused) return;

      if (!isSelected) {
        selectWidget(SelectionRequestType.One, [props.widgetId]);
      }
      showTableFilterPane();
      const draggingState = props.generateDragState(e, draggableRef.current);
      setDraggingState(draggingState);
    }
  };

  return (
    <DraggableWrapper
      className={className}
      data-testid={isSelected ? "t--selected" : ""}
      draggable={allowDrag}
      onDragStart={onDragStart}
      ref={draggableRef}
      style={dragWrapperStyle}
    >
      {props.children}
      {showBoundary && (
        <WidgetBoundaries
          className={`widget-boundary-${props.widgetId}`}
          style={dragBoundariesStyle}
        />
      )}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
