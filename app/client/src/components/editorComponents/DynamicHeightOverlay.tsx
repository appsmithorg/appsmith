import React, { memo, useRef } from "react";
import { useState } from "react";
import { useDrag } from "react-use-gesture";
import styled from "styled-components";

const StyledDynamicHeightOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const OVERLAY_COLOR = "#F32B8B";

interface OverlayDisplayProps {
  maxY: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxY}px;
  border-bottom: 1px solid ${OVERLAY_COLOR};
  background-color: rgba(243, 43, 139, 0.1);
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

const StyledOverlayHandles = styled.div`
  position: absolute;
  right: -16px;
`;

const OverlayHandle = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  height: 18px;
`;

const OverlayHandleDot = styled.div`
  cursor: pointer;
  border-radius: 50%;
`;

const OverlayHandleLabel = styled.div`
  padding: 1px 4px;
  background: #191919;
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  margin-left: 4px;
`;

interface DragFunctions {
  onStop: () => void;
  onUpdate: (n: number) => void;
}

const DraggableOverlayHandleDot: React.FC<DragFunctions> = ({
  children,
  onStop,
  onUpdate,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    (state) => {
      if (state.first) {
        return;
      }

      if (state.last) {
        onStop();
        return;
      }

      onUpdate(state.movement[1]);
    },
    { axis: "y" },
  );
  const bindings = bind();
  return (
    <div
      ref={ref}
      style={{
        cursor: "pointer",
        padding: 4,
      }}
      {...bindings}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        bindings?.onMouseDown && bindings.onMouseDown(e);
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
};
interface OverlayHandleProps {
  y: number;
}

const MinHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MinHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 6px;
  height: 6px;
  border: 1px solid ${OVERLAY_COLOR};
`;

const MaxHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MaxHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 10px;
  height: 10px;
  background-color: ${OVERLAY_COLOR};
`;

function useDy(
  init: number,
  onHeightSet: (height: number) => void,
): [number, DragFunctions] {
  const [y, setY] = useState(init * 10);
  const [dY, setdY] = useState(0);

  function onUpdate(dy: number) {
    setdY(dy);
  }

  function onStop() {
    const heightToSet = y + dY;
    setY(heightToSet);
    setdY(0);
    onHeightSet(heightToSet);
  }

  return [y + dY, { onUpdate, onStop }];
}

interface OverlayHandlesProps {
  maxY: number;
  minY: number;
  maxDragFunctions: DragFunctions;
  minDragFunctions: DragFunctions;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
}

const OverlayHandles: React.FC<OverlayHandlesProps> = ({
  maxDragFunctions,
  maxY,
  minDragFunctions,
  minY,
}) => {
  const isColliding = maxY === minY;

  const maxRows = Math.floor(maxY / 10);
  const minRows = Math.floor(minY / 10);

  return (
    <StyledOverlayHandles>
      <MinHeightOverlayHandle y={minY}>
        <DraggableOverlayHandleDot {...minDragFunctions}>
          <MinHeightOverlayHandleDot />
        </DraggableOverlayHandleDot>
        {!isColliding ? (
          <OverlayHandleLabel>Min-height: {minRows} rows</OverlayHandleLabel>
        ) : null}
      </MinHeightOverlayHandle>
      <MaxHeightOverlayHandle
        style={isColliding ? { right: "-135px" } : undefined}
        y={maxY}
      >
        <DraggableOverlayHandleDot {...maxDragFunctions}>
          <MaxHeightOverlayHandleDot />
        </DraggableOverlayHandleDot>
        <OverlayHandleLabel>Max-height: {maxRows} rows</OverlayHandleLabel>
      </MaxHeightOverlayHandle>
    </StyledOverlayHandles>
  );
};

interface DynamicHeightOverlay extends MinMaxHeightProps {
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
}

const DynamicHeightOverlay: React.FC<DynamicHeightOverlay> = memo(
  ({
    children,
    maxDynamicHeight,
    minDynamicHeight,
    onMaxHeightSet,
    onMinHeightSet,
  }) => {
    const [maxY, maxDragFunctions] = useDy(maxDynamicHeight, onMaxHeightSet);
    const [minY, minDragFunctions] = useDy(minDynamicHeight, onMinHeightSet);

    return (
      <StyledDynamicHeightOverlay>
        <OverlayDisplay maxY={maxY} />
        <OverlayHandles
          maxDragFunctions={maxDragFunctions}
          maxY={maxY}
          minDragFunctions={minDragFunctions}
          minY={minY}
          onMaxHeightSet={onMaxHeightSet}
          onMinHeightSet={onMinHeightSet}
        />
        {children}
      </StyledDynamicHeightOverlay>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.maxDynamicHeight === nextProps.maxDynamicHeight &&
      prevProps.minDynamicHeight === prevProps.maxDynamicHeight
    );
  },
);

DynamicHeightOverlay.displayName = "DynamicHeightOverlay";

export default DynamicHeightOverlay;
