import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import type { CallbackResponseType } from "utils/hooks/useResize";
import useResize, { DIRECTION } from "utils/hooks/useResize";
import { WIDGET_PADDING } from "constants/WidgetConstants";

const ResizeHandle = styled.div<{ isResizing?: boolean }>`
  position: absolute;
  left: -${WIDGET_PADDING}px;
  top: 0;
  width: ${2 * WIDGET_PADDING}px;
  height: 100%;
  cursor: ew-resize;
  transition: ${(props) =>
    props.isResizing ? "none" : "background-color 0.1s ease-in"};

  &:hover {
    background-color: var(--ads-v2-color-bg-muted);
  }
`;

const ResizableContainer = styled.div<{ width: number }>`
  position: relative;
  height: 100%;
  width: ${(props) => props.width}px;
`;

interface RightPaneResizableHandleProps {
  children: React.ReactNode;
}

export function RightPaneResizableHandle({
  children,
}: RightPaneResizableHandleProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320); // Default width
  const MIN_WIDTH = 200;

  const afterResizeCallback = React.useCallback(
    (data: CallbackResponseType) => {
      const newWidth = Math.max(data.width, MIN_WIDTH);

      // Only update React state, DOM updates are handled by useResize
      setWidth(newWidth);
    },
    [MIN_WIDTH],
  );

  const { mouseDown, setMouseDown } = useResize(
    paneRef,
    DIRECTION.horizontal,
    afterResizeCallback,
  );

  const handleMouseDown = useCallback(() => {
    setMouseDown(true);
  }, [setMouseDown]);

  return (
    <ResizableContainer ref={paneRef} width={width}>
      <ResizeHandle isResizing={mouseDown} onMouseDown={handleMouseDown} />
      {children}
    </ResizableContainer>
  );
}
