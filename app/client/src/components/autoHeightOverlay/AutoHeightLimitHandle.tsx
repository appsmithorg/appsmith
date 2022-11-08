import React, { useRef } from "react";
import { useDrag } from "react-use-gesture";
import styled from "styled-components";
import { onDragCallbacksProps, onMouseHoverCallbacksProps } from "./types";
import AutoHeightLimitHandleBorder from "./ui/AutoHeightLimitHandleBorder";
import AutoHeightLimitHandleDot from "./ui/AutoHeightLimitHandleDot";
import AutoHeightLimitHandleLabel from "./ui/AutoHeightLimitHandleLabel";
import { heightToRows } from "./utils";

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

export default AutoHeightLimitHandle;
