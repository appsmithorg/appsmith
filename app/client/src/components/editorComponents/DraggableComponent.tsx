import React, { useContext } from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "assets/images/blank.png";
import { FocusContext, DragResizeContext } from "pages/Editor/CanvasContexts";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { ControlIcons } from "icons/ControlIcons";
import { Tooltip } from "@blueprintjs/core";
import { WIDGET_CLASSNAME_PREFIX } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { AppState } from "reducers";
import { theme, getColorWithOpacity } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

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

const DragHandle = styled.div`
  position: absolute;
  left: 0px;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX]}px;
  cursor: move;
  display: none;
  cursor: grab;
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

const moveControlIcon = ControlIcons.MOVE_CONTROL({
  width: CONTROL_ICON_SIZE,
  height: CONTROL_ICON_SIZE,
});

const deleteControlIcon = ControlIcons.DELETE_CONTROL({
  width: CONTROL_ICON_SIZE,
  height: CONTROL_ICON_SIZE,
});

type DraggableComponentProps = ContainerWidgetProps<WidgetProps>;

/* eslint-disable react/display-name */

const DraggableComponent = (props: DraggableComponentProps) => {
  const {
    focusedWidget,
    selectedWidget,
    focusWidget,
    selectWidget,
    showPropertyPane,
  } = useContext(FocusContext);

  const propertyPaneState: PropertyPaneReduxState = useSelector(
    (state: AppState) => state.ui.propertyPane,
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

  const { isResizing, setIsDragging, isDragging } = useContext(
    DragResizeContext,
  );

  const disableWidgetDrag: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragging.disable,
  );

  const deleteWidget = () => {
    showPropertyPane && showPropertyPane();
    updateWidget &&
      updateWidget(WidgetOperations.DELETE, props.widgetId, {
        parentId: props.parentId,
      });
  };

  const togglePropertyEditor = (e: any) => {
    if (!propertyPaneState.isVisible) {
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
      setIsDragging && setIsDragging(props.widgetId);
    },
    end: (widget, monitor) => {
      if (monitor.didDrop()) {
        showPropertyPane && showPropertyPane(props.widgetId, true);
      }
      setIsDragging && setIsDragging(undefined);
    },
    canDrag: () => {
      return !isResizing && !disableWidgetDrag;
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
          focusWidget && focusWidget(props.widgetId);
          e.stopPropagation();
        }}
        onMouseLeave={(e: any) => {
          focusWidget && focusWidget(null);
          e.stopPropagation();
        }}
        onClick={(e: any) => {
          selectWidget && selectWidget(props.widgetId);
          if (
            propertyPaneState.widgetId &&
            propertyPaneState.widgetId !== props.widgetId
          ) {
            showPropertyPane && showPropertyPane();
          }
          e.stopPropagation();
        }}
        onDoubleClick={(e: any) => {
          showPropertyPane && showPropertyPane(props.widgetId);
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
        }}
      >
        {props.children}

        <DragHandle className="control" ref={drag}>
          <Tooltip content="Move" hoverOpenDelay={500}>
            {moveControlIcon}
          </Tooltip>
        </DragHandle>
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
