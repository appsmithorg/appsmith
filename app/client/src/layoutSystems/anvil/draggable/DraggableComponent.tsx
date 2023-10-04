import type { AppState } from "@appsmith/reducers";
import type { DragEventHandler, PropsWithChildren } from "react";
import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { useShowTableFilterPane } from "utils/hooks/dragResizeHooks";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { useWidgetDrag } from "./useWidgetDrag";

const DraggableWrapper = styled.div`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: grab;
`;

type DraggableComponentProps = PropsWithChildren<{
  widgetId: string;
  parentId?: string;
  resizeDisabled?: boolean;
  type: string;
}>;

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingState } = useWidgetDrag();
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

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      !props.resizeDisabled &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };

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
    isAppSettingsPaneWithNavigationTabOpen,
  );

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
      setDraggingState(true);
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
    >
      {props.children}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
