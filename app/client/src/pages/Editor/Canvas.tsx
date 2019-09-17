import React from "react";
import styled from "styled-components";
import WidgetFactory from "../../utils/WidgetFactory";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { WidgetProps } from "../../widgets/BaseWidget";

const ArtBoard = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
`;

interface CanvasProps {
  layout: ContainerWidgetProps<WidgetProps>;
}

const Canvas = (props: CanvasProps) => {
  return (
    <React.Fragment>
      <ArtBoard>
        {props.layout.widgetId && WidgetFactory.createWidget(props.layout)}
      </ArtBoard>
    </React.Fragment>
  );
};

export default Canvas;
