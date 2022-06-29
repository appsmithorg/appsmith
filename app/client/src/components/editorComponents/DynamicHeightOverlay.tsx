import React, { memo, useEffect, useRef } from "react";
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
  isActive: boolean;
  maxY: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  display: ${(props) => (props.isActive ? "block" : "none")};
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

const StyledDraggableOverlayHandleDot = styled.div`
  cursor: pointer;
`;

interface DragFunctions {
  onStart: () => void;
  onStop: () => void;
  onUpdate: (n: number) => void;
}

const DraggableOverlayHandleDot: React.FC<DragFunctions> = ({
  children,
  onStart,
  onStop,
  onUpdate,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    (state) => {
      if (state.first) {
        onStart();
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
    <StyledDraggableOverlayHandleDot
      ref={ref}
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
    </StyledDraggableOverlayHandleDot>
  );
};
interface OverlayHandleProps {
  y: number;
}

const MinHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MinHeightOverlayHandleDot = styled(OverlayHandleDot)<{
  isActive: boolean;
}>`
  width: 6px;
  height: 6px;
  border: 1px solid ${OVERLAY_COLOR};
  background-color: ${(props) => (props.isActive ? OVERLAY_COLOR : "none")};
`;

const MaxHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MaxHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 10px;
  height: 10px;
  background-color: ${OVERLAY_COLOR};
`;

interface UseHoverStateFunctions {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

type UseHoverStateReturnType = [boolean, UseHoverStateFunctions];

function useHoverState(): UseHoverStateReturnType {
  const [isMinDotActive, setDotActive] = useState(false);

  function handleMinDotMouseEnter(state: boolean) {
    setDotActive(state);
  }

  return [
    isMinDotActive,
    {
      onMouseEnter: () => handleMinDotMouseEnter(true),
      onMouseLeave: () => handleMinDotMouseEnter(false),
    },
  ];
}

interface OverlayHandlesProps {
  isMaxDotActive: boolean;
  isMinDotActive: boolean;
  maxY: number;
  minY: number;
  maxDragFunctions: DragFunctions;
  minDragFunctions: DragFunctions;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  maxHoverFns: UseHoverStateFunctions;
  minHoverFns: UseHoverStateFunctions;
}

const OverlayHandles: React.FC<OverlayHandlesProps> = ({
  isMaxDotActive,
  isMinDotActive,
  maxDragFunctions,
  maxHoverFns,
  maxY,
  minDragFunctions,
  minHoverFns,
  minY,
}) => {
  const isColliding = maxY === minY;

  const maxRows = Math.floor(maxY / 10);
  const minRows = Math.floor(minY / 10);

  return (
    <StyledOverlayHandles>
      <MinHeightOverlayHandle y={minY}>
        <DraggableOverlayHandleDot {...minDragFunctions}>
          <MinHeightOverlayHandleDot
            isActive={isMinDotActive}
            {...minHoverFns}
          />
        </DraggableOverlayHandleDot>
        {!isColliding ? (
          <OverlayHandleLabel
            style={{ display: isMinDotActive ? "initial" : "none" }}
          >
            Min-height: {minRows} rows
          </OverlayHandleLabel>
        ) : null}
      </MinHeightOverlayHandle>
      <MaxHeightOverlayHandle
        style={isColliding ? { right: "-24px" } : undefined}
        y={maxY}
      >
        <DraggableOverlayHandleDot {...maxDragFunctions}>
          <MaxHeightOverlayHandleDot {...maxHoverFns} />
        </DraggableOverlayHandleDot>
        <OverlayHandleLabel
          style={{ display: isMaxDotActive ? "initial" : "none" }}
        >
          Max-height: {maxRows} rows
        </OverlayHandleLabel>
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
    const [isMinDotDragging, setIsMinDotDragging] = useState(false);
    const [isMaxDotDragging, setIsMaxDotDragging] = useState(false);

    const [maxY, setMaxY] = useState(maxDynamicHeight * 10);
    const [maxdY, setMaxdY] = useState(0);

    const [minY, setMinY] = useState(minDynamicHeight * 10);
    const [mindY, setMindY] = useState(0);

    const finalMaxY = maxY + maxdY;
    const finalMinY = minY + mindY;

    useEffect(() => {
      setMaxY(maxDynamicHeight * 10);
    }, [maxDynamicHeight]);

    function onMaxUpdate(dy: number) {
      setMaxdY(dy);
    }

    function onMaxStop() {
      setIsMaxDotDragging(false);
      const heightToSet = maxY + maxdY;
      setMaxY(heightToSet);
      setMaxdY(0);
      onMaxHeightSet(heightToSet);
    }

    /////////////////////////////////////////////////////////

    useEffect(() => {
      setMinY(minDynamicHeight * 10);
    }, [minDynamicHeight]);

    function onMinUpdate(dy: number) {
      if (minY + dy <= 10) {
        return;
      }

      setMindY(dy);
    }

    function onMinStop() {
      setIsMinDotDragging(false);
      const heightToSet = minY + mindY;
      setMinY(heightToSet);
      setMindY(0);
      onMinHeightSet(heightToSet);
    }

    function onMinDotStart() {
      setIsMinDotDragging(true);
    }

    function onMaxDotStart() {
      setIsMaxDotDragging(true);
    }

    const [isMinDotActive, minHoverFns] = useHoverState();
    const [isMaxDotActive, maxHoverFns] = useHoverState();

    return (
      <StyledDynamicHeightOverlay>
        <OverlayDisplay
          isActive={
            isMinDotDragging ||
            isMaxDotDragging ||
            isMinDotActive ||
            isMaxDotActive
          }
          maxY={finalMaxY}
        />
        <OverlayHandles
          isMaxDotActive={isMaxDotDragging || isMaxDotActive}
          isMinDotActive={isMinDotDragging || isMinDotActive}
          maxDragFunctions={{
            onUpdate: onMaxUpdate,
            onStop: onMaxStop,
            onStart: onMaxDotStart,
          }}
          maxHoverFns={maxHoverFns}
          maxY={finalMaxY}
          minDragFunctions={{
            onUpdate: onMinUpdate,
            onStop: onMinStop,
            onStart: onMinDotStart,
          }}
          minHoverFns={minHoverFns}
          minY={finalMinY}
          onMaxHeightSet={onMaxHeightSet}
          onMinHeightSet={onMinHeightSet}
        />
        {children}
      </StyledDynamicHeightOverlay>
    );
  },
);

DynamicHeightOverlay.displayName = "DynamicHeightOverlay";

export default DynamicHeightOverlay;
