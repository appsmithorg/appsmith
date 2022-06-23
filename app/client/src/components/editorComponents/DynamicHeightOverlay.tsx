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
  maxDynamicHeight: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxDynamicHeight * 10}px;
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

const DraggableOverlayHandleDot: React.FC<{
  onUpdate: (dy: number) => void;
  onStop: () => void;
}> = ({ children, onStop, onUpdate }) => {
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
): [number, { onStop: () => void; onUpdate: (n: number) => void }] {
  const [y, setY] = useState(init * 10);
  const [dY, setdY] = useState(0);

  function onUpdate(dy: number) {
    setdY(dy);
  }

  function onStop() {
    setY(y + dY);
    setdY(0);
  }

  return [y + dY, { onUpdate, onStop }];
}

const OverlayHandles: React.FC<MinMaxHeightProps> = ({
  maxDynamicHeight,
  minDynamicHeight,
}) => {
  const isColliding = minDynamicHeight === maxDynamicHeight;

  const [maxY, maxFns] = useDy(maxDynamicHeight);
  const [minY, minFns] = useDy(minDynamicHeight);

  return (
    <StyledOverlayHandles>
      <MinHeightOverlayHandle y={minY}>
        <DraggableOverlayHandleDot {...minFns}>
          <MinHeightOverlayHandleDot />
        </DraggableOverlayHandleDot>
        {!isColliding ? (
          <OverlayHandleLabel>
            Min-height: {minDynamicHeight} rows
          </OverlayHandleLabel>
        ) : null}
      </MinHeightOverlayHandle>
      <MaxHeightOverlayHandle
        style={isColliding ? { right: "-135px" } : undefined}
        y={maxY}
      >
        <DraggableOverlayHandleDot {...maxFns}>
          <MaxHeightOverlayHandleDot />
        </DraggableOverlayHandleDot>
        <OverlayHandleLabel>
          Max-height: {maxDynamicHeight} rows
        </OverlayHandleLabel>
      </MaxHeightOverlayHandle>
    </StyledOverlayHandles>
  );
};

const DynamicHeightOverlay: React.FC<MinMaxHeightProps> = memo(
  ({ children, maxDynamicHeight, minDynamicHeight }) => {
    return (
      <StyledDynamicHeightOverlay>
        <OverlayDisplay maxDynamicHeight={maxDynamicHeight} />
        <OverlayHandles
          maxDynamicHeight={maxDynamicHeight}
          minDynamicHeight={minDynamicHeight}
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
