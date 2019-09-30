import React from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "../assets/images/blank.png";
import { ContainerProps } from "./ContainerComponent";
import { ControlIcons } from "../icons/ControlIcons";
import { theme } from "../constants/DefaultTheme";

const DraggableWrapper = styled.div`
  &:hover > div {
    display: block;
  }
`;

const DragHandle = styled.div`
  position: absolute;
  left: -${props => props.theme.spaces[4]}px;
  top: -${props => props.theme.spaces[4]}px;
  cursor: move;
  display: none;
  cursor: pointer;
  z-index: 11;
`;

const DeleteControl = styled.div`
  position: absolute;
  right: -${props => props.theme.spaces[4]}px;
  top: -${props => props.theme.spaces[4]}px;
  display: none;
  cursor: pointer;
  z-index: 11;
`;

const moveControlIcon = ControlIcons.MOVE_CONTROL({
  width: theme.fontSizes[6],
  height: theme.fontSizes[6],
});

const deleteControlIcon = ControlIcons.DELETE_CONTROL({
  width: theme.fontSizes[6],
  height: theme.fontSizes[6],
});

type DraggableComponentProps = WidgetProps & ContainerProps;

const DraggableComponent = (props: DraggableComponentProps) => {
  const deleteWidget = () => {
    props.updateWidget &&
      props.updateWidget(WidgetOperations.DELETE, props.widgetId);
  };
  const [{ isDragging }, drag, preview] = useDrag({
    item: props,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <React.Fragment>
      <DragPreviewImage src={blankImage} connect={preview} />
      <DraggableWrapper
        ref={preview}
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
        }}
      >
        <DragHandle ref={drag}>{moveControlIcon}</DragHandle>
        <DeleteControl onClick={deleteWidget}>
          {deleteControlIcon}
        </DeleteControl>
        {props.children}
      </DraggableWrapper>
    </React.Fragment>
  );
};

export default DraggableComponent;
