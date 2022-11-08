import React from "react";
import styled from "styled-components";
import { onDragCallbacksProps, onMouseHoverCallbacksProps } from "./types";
import AutoHeightLimitHandle from "./AutoHeightLimitHandle";

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
