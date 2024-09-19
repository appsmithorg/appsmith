import React, { useRef } from "react";
import styled from "styled-components";
import AutoHeightLimitHandleBorder from "./ui/AutoHeightLimitHandleBorder";
import { useDrag } from "react-use-gesture";
import { heightToRows } from "./utils";
import AutoHeightLimitHandleLabel from "./ui/AutoHeightLimitHandleLabel";
import type { onDragCallbacksProps, onMouseHoverCallbacksProps } from "./types";
import AutoHeightLimitHandleDot from "./ui/AutoHeightLimitHandleDot";

const AutoHeightLimitHandleGroupContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: all;
  width: 100%;
  z-index: 1;
`;

interface AutoHeightLimitHandleGroupProps {
  isMaxDotActive: boolean;
  isMinDotActive: boolean;
  isMaxDotDragging: boolean;
  isMinDotDragging: boolean;
  maxY: number;
  minY: number;
  onMaxLimitDragCallbacks: onDragCallbacksProps;
  onMinLimitDragCallbacks: onDragCallbacksProps;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  onMaxLimitMouseHoverCallbacks: onMouseHoverCallbacksProps;
  onMinLimitMouseHoverCallbacks: onMouseHoverCallbacksProps;
}

interface AutoHeightLimitHandleContainerProps {
  height: number;
}

const AutoHeightLimitHandleContainer = styled.div<AutoHeightLimitHandleContainerProps>`
  position: absolute;
  display: flex;
  align-items: center;
  width: 100%;
  height: 13px;
  transform: translateY(${(props) => props.height - 6}px);
  cursor: ns-resize;
  display: flex;
  align-items: center;
`;

interface AutoHeightLimitHandleProps {
  cypressDataID: string;
  height: number;
  isActive: boolean;
  isColliding: boolean;
  isDragging: boolean;
  label: string;
  onDragCallbacks: onDragCallbacksProps;
  onMouseHoverFunctions: onMouseHoverCallbacksProps;
}

const AutoHeightLimitHandle = ({
  cypressDataID,
  height,
  isActive,
  isColliding,
  isDragging,
  label,
  onDragCallbacks,
  onMouseHoverFunctions,
}: AutoHeightLimitHandleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { onStart, onStop, onUpdate } = onDragCallbacks;

  const bind = useDrag((state) => {
    if (state.first) {
      onStart();

      return;
    }

    if (state.last) {
      onStop();

      return;
    }

    const [mx, my] = state.movement;

    onUpdate(mx, my);
  });

  const bindings = bind();

  return (
    <AutoHeightLimitHandleContainer
      data-testid={cypressDataID}
      height={height}
      ref={ref}
      {...bindings}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        bindings?.onMouseDown && bindings.onMouseDown(e);
      }}
      {...onMouseHoverFunctions}
    >
      <AutoHeightLimitHandleBorder isActive={isActive} />
      <AutoHeightLimitHandleDot isDragging={isDragging} />
      {!isColliding ? (
        <AutoHeightLimitHandleLabel isActive={isActive}>
          {label}: {heightToRows(height)} rows
        </AutoHeightLimitHandleLabel>
      ) : null}
    </AutoHeightLimitHandleContainer>
  );
};

const AutoHeightLimitHandleGroup: React.FC<AutoHeightLimitHandleGroupProps> = ({
  isMaxDotActive,
  isMaxDotDragging,
  isMinDotActive,
  isMinDotDragging,
  maxY,
  minY,
  onMaxLimitDragCallbacks,
  onMaxLimitMouseHoverCallbacks,
  onMinLimitDragCallbacks,
  onMinLimitMouseHoverCallbacks,
}) => {
  const isColliding = maxY === minY;

  return (
    <AutoHeightLimitHandleGroupContainer data-testid="t-auto-height-overlay-handles">
      <AutoHeightLimitHandle
        cypressDataID="t--auto-height-overlay-handles-min"
        height={minY}
        isActive={isMinDotActive}
        isColliding={isColliding}
        isDragging={isMinDotDragging}
        label="Min-Height"
        onDragCallbacks={onMinLimitDragCallbacks}
        onMouseHoverFunctions={onMinLimitMouseHoverCallbacks}
      />
      <AutoHeightLimitHandle
        cypressDataID="t--auto-height-overlay-handles-max"
        height={maxY}
        isActive={isMaxDotActive}
        isColliding={false}
        isDragging={isMaxDotDragging}
        label={isColliding ? "Height" : "Max-Height"}
        onDragCallbacks={onMaxLimitDragCallbacks}
        onMouseHoverFunctions={onMaxLimitMouseHoverCallbacks}
      />
    </AutoHeightLimitHandleGroupContainer>
  );
};

export default AutoHeightLimitHandleGroup;
