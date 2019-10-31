import React, {
  useContext,
  createContext,
  useState,
  Context,
  useCallback,
} from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "../../widgets/BaseWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "../../assets/images/blank.png";
import { ContainerProps } from "../appsmith/ContainerComponent";
import { FocusContext } from "../../pages/Editor/Canvas";
import { WidgetFunctionsContext } from "../../pages/Editor/WidgetsEditor";
import { ControlIcons } from "../../icons/ControlIcons";
import { theme } from "../../constants/DefaultTheme";
import { ResizingContext } from "./DropTargetComponent";
import { Tooltip } from "@blueprintjs/core";

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
`;

const DragHandle = styled.div`
  position: absolute;
  left: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX] / 2}px;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX] / 2}px;
  cursor: move;
  display: none;
  cursor: grab;
`;

const DeleteControl = styled.div`
  position: absolute;
  right: ${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX]}px;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX] / 2}px;
  display: none;
  cursor: pointer;
`;

const EditControl = styled.div`
  position: absolute;
  right: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX] / 2}px;
  top: -${props => props.theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX] / 2}px;
  display: none;
  cursor: pointer;
`;

const DraggableMask = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
`;

const moveControlIcon = ControlIcons.MOVE_CONTROL({
  width: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
  height: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
});

const deleteControlIcon = ControlIcons.DELETE_CONTROL({
  width: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
  height: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
});

const editControlIcon = ControlIcons.EDIT_CONTROL({
  width: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
  height: theme.fontSizes[CONTROL_THEME_FONTSIZE_INDEX],
});

type DraggableComponentProps = WidgetProps & ContainerProps;

export const DraggableComponentContext: Context<{
  isDragging?: boolean;
  widgetNode?: HTMLDivElement;
}> = createContext({});
/* eslint-disable react/display-name */

//TODO(abhinav): the contexts and states are getting out of hand.
// Refactor here and in ResizableComponent

const DraggableComponent = (props: DraggableComponentProps) => {
  const { isFocused, setFocus, showPropertyPane } = useContext(FocusContext);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  const [currentNode, setCurrentNode] = useState<HTMLDivElement>();
  const referenceRef = useCallback(
    node => {
      if (node !== null && node !== currentNode) {
        setCurrentNode(node);
      }
    },
    [setCurrentNode, currentNode],
  );
  const { isResizing } = useContext(ResizingContext);

  const deleteWidget = () => {
    showPropertyPane && showPropertyPane();
    updateWidget &&
      updateWidget(WidgetOperations.DELETE, props.widgetId, {
        parentId: props.parentId,
      });
  };

  const togglePropertyEditor = (e: any) => {
    if (showPropertyPane && props.widgetId && currentNode) {
      showPropertyPane(props.widgetId, currentNode, true);
    }
    e.stopPropagation();
  };

  const [{ isDragging }, drag, preview] = useDrag({
    item: props,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: () => {
      if (isFocused === props.widgetId && showPropertyPane && currentNode) {
        showPropertyPane(props.widgetId, undefined);
      }
    },
    end: (widget, monitor) => {
      if (monitor.didDrop()) {
        if (isFocused === props.widgetId && showPropertyPane && currentNode) {
          showPropertyPane(props.widgetId, currentNode);
        }
      }
    },
    canDrag: () => {
      return !isResizing && !!isFocused && isFocused === props.widgetId;
    },
  });

  return (
    <DraggableComponentContext.Provider
      value={{ isDragging, widgetNode: currentNode }}
    >
      <DragPreviewImage src={blankImage} connect={preview} />
      <DraggableWrapper
        ref={drag}
        onClick={(e: any) => {
          if (setFocus && showPropertyPane) {
            setFocus(props.widgetId);
            showPropertyPane(props.widgetId, currentNode);
            e.stopPropagation();
          }
        }}
        show={props.widgetId === isFocused && !isResizing}
        style={{
          display: isDragging ? "none" : "flex",
          flexDirection: "column",
          position: "absolute",
          left: props.style
            ? props.style.xPosition + props.style.xPositionUnit
            : 0,
          top: props.style
            ? props.style.yPosition + props.style.yPositionUnit
            : 0,
          minWidth:
            props.style.componentWidth + (props.style.widthUnit || "px"),
          minHeight:
            props.style.componentHeight + (props.style.heightUnit || "px"),
          userSelect: "none",
        }}
      >
        <DraggableMask ref={referenceRef} />
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
          <Tooltip content="Toggle props" hoverOpenDelay={500}>
            {editControlIcon}
          </Tooltip>
        </EditControl>
      </DraggableWrapper>
    </DraggableComponentContext.Provider>
  );
};

export default DraggableComponent;
