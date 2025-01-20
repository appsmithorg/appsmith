import React, { useRef, useState } from "react";
import styled from "styled-components";
import type { CallbackResponseType } from "utils/hooks/useResize";
import useResize, { DIRECTION } from "utils/hooks/useResize";
import { Colors } from "constants/Colors";
import { WIDGET_PADDING } from "constants/WidgetConstants";

const ResizeHandle = styled.div`
  position: absolute;
  left: -${WIDGET_PADDING}px;
  top: 0;
  width: ${2 * WIDGET_PADDING}px;
  height: 100%;
  cursor: ew-resize;
  transition: background-color 0.1s ease-in;

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
      setWidth(newWidth);

      if (paneRef.current) {
        paneRef.current.style.width = `${newWidth}px`;
      }
    },
    [],
  );

  const { setMouseDown } = useResize(
    paneRef,
    DIRECTION.horizontal,
    afterResizeCallback,
  );

  return (
    <ResizableContainer ref={paneRef} width={width}>
      <ResizeHandle onMouseDown={() => setMouseDown(true)} />
      {children}
    </ResizableContainer>
  );
}
