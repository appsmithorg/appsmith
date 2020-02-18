import React, { useContext } from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "assets/images/blank.png";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { ControlIcons } from "icons/ControlIcons";
import { Tooltip } from "@blueprintjs/core";
import { WIDGET_CLASSNAME_PREFIX } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { AppState } from "reducers";
import { theme, getColorWithOpacity } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import {
  useWidgetSelection,
  useShowPropertyPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";

// FontSizes array in DefaultTheme.tsx
// Change this to toggle the size of delete and move handles.
const CONTROL_THEME_FONTSIZE_INDEX = 6;

const DraggableWrapper = styled.div<{ show: boolean }>`
  pointer-events: auto !important;
  & > div.control {
    display: ${props => (props.show ? "block" : "none")};
  }
  display: block;
  position: relative;
  z-index: 1;
  cursor: grab;
`;

const WidgetBoundaries = styled.div`
  left: 0;
  right: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  border: 1px dashed
    ${props => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  position: absolute;
  pointer-events: none;
`;

const ClickCaptureMask = styled.div`
  position: absolute;
  left: 0;
  top: 5%;
  width: 100%;
  height: 95%;
  z-index: 2;
`;

const DeleteControl = styled.div`
  position: absolute;
  right: ${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX]}px;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX]}px;
  display: none;
  cursor: pointer;
`;

const EditControl = styled.div`
  position: absolute;
  right: 0;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX]}px;
  display: none;
  cursor: pointer;
`;

const CONTROL_ICON_SIZE = 20;

const deleteControlIcon = ControlIcons.DELETE_CONTROL({
  width: CONTROL_ICON_SIZE,
  height: CONTROL_ICON_SIZE,
});

type DraggableComponentProps = ContainerWidgetProps<WidgetProps>;

/* eslint-disable react/display-name */

const DraggableComponent = (props: DraggableComponentProps) => {
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget, focusWidget } = useWidgetSelection();
  const { setIsDragging } = useWidgetDragResize();

  const propertyPaneState: PropertyPaneReduxState = useSelector(
    (state: AppState) => state.ui.propertyPane,
  );
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.editor.selectedWidget,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.editor.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const editControlIcon = ControlIcons.EDIT_CONTROL({
    width: CONTROL_ICON_SIZE,
    height: CONTROL_ICON_SIZE,
    color:
      propertyPaneState.widgetId === props.widgetId &&
      propertyPaneState.isVisible
        ? theme.colors.textDefault
        : theme.colors.textOnDarkBG,
    background:
      propertyPaneState.widgetId === props.widgetId &&
      propertyPaneState.isVisible
        ? Colors.HIT_GRAY
        : Colors.SHARK,
  });

  const { updateWidget } = useContext(EditorContext);

  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  const deleteWidget = () => {
    showPropertyPane && showPropertyPane();
    updateWidget &&
      updateWidget(WidgetOperations.DELETE, props.widgetId, {
        parentId: props.parentId,
      });
  };

  const togglePropertyEditor = (e: any) => {
    if (
      (!propertyPaneState.isVisible &&
        props.widgetId === propertyPaneState.widgetId) ||
      props.widgetId !== propertyPaneState.widgetId
    ) {
      showPropertyPane && showPropertyPane(props.widgetId);
    } else {
      showPropertyPane && showPropertyPane();
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const [{ isCurrentWidgetDragging }, drag, preview] = useDrag({
    item: props as WidgetProps,
    collect: (monitor: DragSourceMonitor) => ({
      isCurrentWidgetDragging: monitor.isDragging(),
    }),
    begin: () => {
      showPropertyPane && showPropertyPane(undefined, true);
      selectWidget && selectWidget(props.widgetId);
      setIsDragging && setIsDragging(true);
    },
    end: (widget, monitor) => {
      if (monitor.didDrop()) {
        showPropertyPane && showPropertyPane(props.widgetId, true);
      }
      setIsDragging && setIsDragging(false);
    },
    canDrag: () => {
      return !isResizing && !isDraggingDisabled;
    },
  });

  let stackingContext = 0;
  if (props.widgetId === selectedWidget) {
    stackingContext = 1;
  }
  if (props.widgetId === focusedWidget) {
    stackingContext = 2;
  }
  const isResizingOrDragging =
    selectedWidget !== props.widgetId && (!!isResizing || !!isDragging);

  return (
    <React.Fragment>
      <DragPreviewImage connect={preview} src={blankImage} />

      <DraggableWrapper
        className={WIDGET_CLASSNAME_PREFIX + props.widgetId}
        ref={drag}
        onMouseOver={(e: any) => {
          focusWidget &&
            focusedWidget !== props.widgetId &&
            focusWidget(props.widgetId);
          e.stopPropagation();
        }}
        onMouseLeave={(e: any) => {
          focusWidget && focusedWidget === props.widgetId && focusWidget();
          e.stopPropagation();
        }}
        onClick={(e: any) => {
          selectWidget && selectWidget(props.widgetId);
          showPropertyPane &&
            !isResizingOrDragging &&
            showPropertyPane(props.widgetId);
          e.stopPropagation();
        }}
        show={
          (props.widgetId === focusedWidget ||
            props.widgetId === selectedWidget) &&
          !isResizing
        }
        style={{
          display: isCurrentWidgetDragging ? "none" : "flex",
          flexDirection: "column",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          userSelect: "none",
          cursor: "drag",
          zIndex: stackingContext,
          pointerEvents: !isResizingOrDragging ? "auto" : "none",
        }}
      >
        {selectedWidget !== props.widgetId && props.isDefaultClickDisabled && (
          <ClickCaptureMask
            onClick={(e: any) => {
              selectWidget && selectWidget(props.widgetId);
              showPropertyPane && showPropertyPane(props.widgetId);
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        )}

        {props.children}
        <DeleteControl className="control" onClick={deleteWidget}>
          <Tooltip content="Delete" hoverOpenDelay={500}>
            {deleteControlIcon}
          </Tooltip>
        </DeleteControl>
        <EditControl className="control" onClick={togglePropertyEditor}>
          <Tooltip content="Show props" hoverOpenDelay={500}>
            {editControlIcon}
          </Tooltip>
        </EditControl>
        <WidgetBoundaries
          style={{ display: isResizingOrDragging ? "block" : "none" }}
        />
      </DraggableWrapper>
    </React.Fragment>
  );
};

export default DraggableComponent;
