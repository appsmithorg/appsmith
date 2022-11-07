import React, { useRef } from "react";
import styled from "styled-components";
import AutoHeightLimitHandleBorder from "./ui/AutoHeightLimitHandleBorder";
import { useDrag } from "react-use-gesture";
import { OVERLAY_COLOR } from "./constants";
import { heightToRows } from "./utils";
import AutoHeightLimitHandleLabel from "./ui/AutoHeightLimitHandleLabel";
import { onDragCallbacksProps, onMouseHoverCallbacksProps } from "./types";

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

const AutoHeightLimitHandleContainer = styled.div<
  AutoHeightLimitHandleContainerProps
>`
  position: absolute;
  display: flex;
  align-items: center;
  width: 100%;
  height: 6px;
  transform: translateY(${(props) => props.height}px);
`;

interface AutoHeightLimitHandleDotProps {
  isActive: boolean;
  isDragging: boolean;
}

const AutoHeightLimitHandleDot = styled.div<AutoHeightLimitHandleDotProps>`
  align-self: start;
  position: absolute;
  left: 50%;
  top: -3px;
  cursor: ns-resize;
  border-radius: 50%;
  width: 7px;
  height: 7px;
  transform: translate(-50%)
    scale(${(props) => (props.isDragging ? "1.67" : "1")});
  border: 1px solid ${OVERLAY_COLOR};
  background-color: ${OVERLAY_COLOR};
  box-shadow: 0px 0px 0px 2px white;
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
      const [mx, my] = state.movement;

      onUpdate(mx, my);
    },
    { axis: "y" },
  );

  const bindings = bind();

  return (
    <AutoHeightLimitHandleContainer
      data-cy={cypressDataID}
      height={height}
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
      {...onMouseHoverFunctions}
    >
      <AutoHeightLimitHandleBorder isActive={isActive} />
      <AutoHeightLimitHandleDot isActive={isActive} isDragging={isDragging} />
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
    <AutoHeightLimitHandleGroupContainer data-cy="t-auto-height-overlay-handles">
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
        isColliding={isColliding}
        isDragging={isMaxDotDragging}
        label="Max-Height"
        onDragCallbacks={onMaxLimitDragCallbacks}
        onMouseHoverFunctions={onMaxLimitMouseHoverCallbacks}
      />
    </AutoHeightLimitHandleGroupContainer>
  );
};

export default AutoHeightLimitHandleGroup;
