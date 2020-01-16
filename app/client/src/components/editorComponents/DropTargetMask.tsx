import React, { useLayoutEffect, MutableRefObject, memo } from "react";
import styled from "styled-components";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
type DropTargetMaskProps = {
  rowHeight: number;
  columnWidth: number;
  setBounds?: Function;
};

export const DropTargetMaskWrapper = styled.div<DropTargetMaskProps>`
  position: absolute;
  left: ${CONTAINER_GRID_PADDING}px;
  top: ${CONTAINER_GRID_PADDING}px;
  bottom: ${CONTAINER_GRID_PADDING}px;
  right: ${CONTAINER_GRID_PADDING}px;

  background-image: radial-gradient(
    circle,
    ${props => props.theme.colors.grid} 2px,
    transparent 0
  );
  background-size: ${props => props.columnWidth}px ${props => props.rowHeight}px;
  background-position: -${props => props.columnWidth / 2}px -${props =>
      props.rowHeight / 2}px;
`;
/* eslint-disable react/display-name */
export const DropTargetMask = memo((props: DropTargetMaskProps) => {
  const dropTargetMask: MutableRefObject<HTMLDivElement | null> = React.useRef(
    null,
  );
  // Fetch new height, width, x and y positions
  useLayoutEffect(() => {
    const el = dropTargetMask.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      props.setBounds && props.setBounds(rect);
    }
  });

  return <DropTargetMaskWrapper {...props} ref={dropTargetMask} />;
});

export default DropTargetMask;
