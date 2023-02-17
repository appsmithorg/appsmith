import React, { CSSProperties, useMemo, useRef } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

const DraggableWrapper = styled.div`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: grab;
`;

type DraggableComponentProps = WidgetProps;

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
  position: absolute;
  left: 0;
`;

/**
 * can drag helper function for react-dnd hook
 *
 * @param isResizingOrDragging
 * @param isDraggingDisabled
 * @param props
 * @param isSnipingMode
 * @param isPreviewMode
 * @returns
 */
export const canDrag = (
  isResizingOrDragging: boolean,
  isDraggingDisabled: boolean,
  props: any,
  isSnipingMode: boolean,
  isPreviewMode: boolean,
) => {
  return (
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !props?.dragDisabled &&
    !isSnipingMode &&
    !isPreviewMode
  );
};

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingCanvas, setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();

  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));

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

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const isCurrentWidgetDragging = isDragging && isSelected;
  const isCurrentWidgetResizing = isResizing && isSelected;
  const showBoundary = isCurrentWidgetDragging || isDraggingSibling;

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      !props.resizeDisabled &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };
  const shouldRenderComponent = !(isSelected && isDragging);
  // Display this draggable based on the current drag state
  const dragWrapperStyle: CSSProperties = {
    display: isCurrentWidgetDragging ? "none" : "block",
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

  const allowDrag = canDrag(
    isResizingOrDragging,
    isDraggingDisabled,
    props,
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
      if (!isFocused) return;

      if (!isSelected) {
        selectWidget(SelectionRequestType.One, [props.widgetId]);
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
      data-testid={isSelected ? "t--selected" : ""}
      draggable={allowDrag}
      onDragStart={onDragStart}
      onMouseOver={handleMouseOver}
      ref={draggableRef}
      style={dragWrapperStyle}
    >
      {shouldRenderComponent && props.children}
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
