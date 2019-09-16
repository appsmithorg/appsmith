import React, { MutableRefObject } from "react";
import styled from "styled-components";
import WidgetFactory from "../../utils/WidgetFactory";
import { WidgetTypes } from "../../constants/WidgetConstants";
import { useDrop } from "react-dnd";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const ArtBoardBackgroundMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  z-index: -10;
`;

const ArtBoard = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
`;

interface CanvasProps {
  pageWidget: ContainerWidgetProps<any>;
  addWidget: Function;
}

const Canvas = (props: CanvasProps) => {
  const artBoardMask: MutableRefObject<HTMLDivElement | null> = React.useRef(
    null,
  );
  const [, drop] = useDrop({
    accept: Object.values(WidgetTypes),
  });

  return (
    <React.Fragment>
      <ArtBoard ref={drop}>
        <ArtBoardBackgroundMask ref={artBoardMask}></ArtBoardBackgroundMask>
        {props.pageWidget && WidgetFactory.createWidget(props.pageWidget)}
      </ArtBoard>
    </React.Fragment>
  );
};

export default Canvas;
