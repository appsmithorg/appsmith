import React from "react";
import styled from "styled-components";
import { XYCoord, useDragLayer } from "react-dnd";
import snapToGrid from "./snapToGrid";
import WidgetFactory from "../../utils/WidgetFactory";
import { RenderModes, WidgetType } from "../../constants/WidgetConstants";

const WrappedDragLayer = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 100;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border: 10px solid #000;
`;

function getItemStyles(
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null,
) {
  if (!initialOffset || !currentOffset) {
    return {
      display: "none",
    };
  }

  let { x, y } = currentOffset;

  x -= initialOffset.x;
  y -= initialOffset.y;
  [x, y] = snapToGrid(64, x, y);
  x += initialOffset.x;
  y += initialOffset.y;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

const EditorDragLayer: React.FC = () => {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  function renderItem() {
    return WidgetFactory.createWidget({
      widgetType: itemType as WidgetType,
      widgetName: "",
      widgetId: item.key,
      topRow: 10,
      leftColumn: 10,
      bottomRow: 14,
      rightColumn: 20,
      parentColumnSpace: 1,
      parentRowSpace: 1,
      renderMode: RenderModes.CANVAS,
    });
  }

  if (!isDragging) {
    return null;
  }
  return (
    <WrappedDragLayer>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </WrappedDragLayer>
  );
};
export default EditorDragLayer;
