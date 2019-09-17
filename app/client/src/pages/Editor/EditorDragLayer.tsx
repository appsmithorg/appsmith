import React from "react";
import styled from "styled-components";
import { useDragLayer } from "react-dnd";

const WrappedDragLayer = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 100;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
`;

const EditorDragLayer = () => {
  const { isDragging } = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }
  return <WrappedDragLayer></WrappedDragLayer>;
};
export default EditorDragLayer;
