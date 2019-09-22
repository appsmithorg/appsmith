import React from "react";
import { Icon } from "@blueprintjs/core";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { useDrag, DragPreviewImage, DragSourceMonitor } from "react-dnd";
import blankImage from "../assets/images/blank.png";
import { ContainerProps } from "./ContainerComponent";

const DragHandle = styled.div`
  position: absolute;
  left: ${props => props.theme.spaces[2]}px;
  top: -${props => props.theme.spaces[8]}px;
  cursor: move;
`;

const DeleteControl = styled.div`
  position: absolute;
  right: ${props => props.theme.spaces[2]}px;
  top: -${props => props.theme.spaces[8]}px;
`;

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
      <div
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
        <DragHandle ref={drag}>
          <Icon icon="drag-handle-horizontal" iconSize={20} />
        </DragHandle>
        <DeleteControl onClick={deleteWidget}>
          <Icon icon="trash" iconSize={20} />
        </DeleteControl>
        {props.children}
      </div>
    </React.Fragment>
  );
};

export default DraggableComponent;
