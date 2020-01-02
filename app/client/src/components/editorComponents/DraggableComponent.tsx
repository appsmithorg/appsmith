import React, {
  useContext,
  createContext,
  useState,
  Context,
  useCallback,
} from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "assets/images/blank.png";
import { FocusContext, ResizingContext } from "pages/Editor/CanvasContexts";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { ControlIcons } from "icons/ControlIcons";
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

const DraggableMask = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
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

const editControlIcon = ControlIcons.EDIT_CONTROL({
  width: CONTROL_ICON_SIZE,
  height: CONTROL_ICON_SIZE,
});

type DraggableComponentProps = ContainerWidgetProps<WidgetProps>;

export const DraggableComponentContext: Context<{
  isDragging?: boolean;
  widgetNode?: HTMLDivElement;
}> = createContext({});
/* eslint-disable react/display-name */

const DraggableComponent = (props: DraggableComponentProps) => {
  const {
    isFocused,
    setFocus,
    showPropertyPane,
    propertyPaneWidgetId,
  } = useContext(FocusContext);
  const { updateWidget } = useContext(EditorContext);

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
    item: props as WidgetProps,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: () => {
      if (showPropertyPane && currentNode) {
        showPropertyPane(props.widgetId, undefined);
      }
    },
    end: (widget, monitor) => {
      if (monitor.didDrop()) {
        if (showPropertyPane && currentNode) {
          showPropertyPane(props.widgetId, currentNode);
        }
      }
    },
    canDrag: () => {
      return !isResizing;
    },
  });

  return (
    <DraggableComponentContext.Provider
      value={{ isDragging, widgetNode: currentNode }}
    >
      <DragPreviewImage connect={preview} src={blankImage} />
      <DraggableWrapper
        className={props.widgetId}
        ref={drag}
        onMouseOver={(e: any) => {
          if (setFocus) {
            setFocus(props.widgetId);
            e.stopPropagation();
          }
        }}
        onMouseLeave={(e: any) => {
          setFocus && setFocus(null);
          e.stopPropagation();
        }}
        onClick={(e: any) => {
          if (propertyPaneWidgetId && propertyPaneWidgetId !== props.widgetId) {
            showPropertyPane && showPropertyPane();
          }
          e.stopPropagation();
        }}
        onDoubleClick={(e: any) => {
          setFocus && setFocus(props.widgetId);
          showPropertyPane && showPropertyPane(props.widgetId, currentNode);
          e.stopPropagation();
        }}
        show={props.widgetId === isFocused && !isResizing}
        style={{
          display: isDragging ? "none" : "flex",
          flexDirection: "column",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
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
