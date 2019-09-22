import React from "react";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { Resizable, ResizeDirection } from "re-resizable";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { ContainerProps } from "./ContainerComponent";

export type ResizableComponentProps = WidgetProps & ContainerProps;

const ResizableContainer = styled(Resizable)`
  border: ${props => {
    return Object.values(props.theme.borders[0]).join(" ");
  }};
`;

const CustomHandle = (props: any) => <div {...props} />;
const BottomRightHandle = () => (
  <CustomHandle>
    <Icon iconSize={15} icon="arrow-bottom-right" />
  </CustomHandle>
);

export const ResizableComponent = (props: ResizableComponentProps) => {
  const updateSize = (
    e: Event,
    dir: ResizeDirection,
    ref: any,
    delta: { width: number; height: number },
  ) => {
    props.updateWidget &&
      props.updateWidget(WidgetOperations.RESIZE, props.widgetId, delta);
  };
  return (
    <ResizableContainer
      size={{
        width: props.style.defaultWidth as number,
        height: props.style.defaultHeight as number,
      }}
      style={{ ...props.style }}
      handleComponent={{ bottomRight: <BottomRightHandle /> }}
      onResizeStop={updateSize}
    >
      {props.children}
    </ResizableContainer>
  );
};

export default ResizableComponent;
