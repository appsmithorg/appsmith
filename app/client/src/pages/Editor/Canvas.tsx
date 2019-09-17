import React from "react";
import styled from "styled-components";
import WidgetFactory from "../../utils/WidgetFactory";
import { WidgetTypes, RenderModes } from "../../constants/WidgetConstants";
import { WidgetFunctions } from "../../widgets/BaseWidget";
import { useDrop } from "react-dnd";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const ArtBoard = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
`;

interface CanvasProps {
  pageWidget: ContainerWidgetProps<any>;
  addWidget: Function;
  widgetFunctions: WidgetFunctions;
}

const Canvas = (props: CanvasProps) => {
  const [, drop] = useDrop({
    accept: Object.values(WidgetTypes),
  });

  return (
    <React.Fragment>
      <ArtBoard ref={drop}>
        {props.pageWidget &&
          WidgetFactory.createWidget(
            props.pageWidget,
            props.widgetFunctions,
            RenderModes.CANVAS,
          )}
      </ArtBoard>
    </React.Fragment>
  );
};

export default Canvas;
