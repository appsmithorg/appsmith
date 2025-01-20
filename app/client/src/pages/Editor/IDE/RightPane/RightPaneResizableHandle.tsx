import React, { useEffect, useCallback, useRef, useState } from "react";
import styled from "styled-components";
import type { CallbackResponseType } from "utils/hooks/useResize";
import useResize, { DIRECTION } from "utils/hooks/useResize";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";

const ResizeHandle = styled.div<{ isResizing?: boolean }>`
  position: absolute;
  left: -${WIDGET_PADDING}px;
  top: 0;
  width: ${2 * WIDGET_PADDING}px;
  height: 100%;
  cursor: ew-resize;
  transition: ${(props) =>
    props.isResizing ? "none" : "background-color 0.1s ease-in"};
  z-index: 999;

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

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function RightPaneResizableHandle({
  children,
}: RightPaneResizableHandleProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const PropertyPaneWidth = useSelector(getPropertyPaneWidth);
  const [width, setWidth] = useState(PropertyPaneWidth); // Default width

  const dispatch = useDispatch();

  useEffect(
    function syncWidth() {
      setWidth(PropertyPaneWidth);
    },
    [PropertyPaneWidth],
  );

  const afterResizeCallback = React.useCallback(
    (data: CallbackResponseType) => {
      const newWidth = Math.max(
        Math.min(width - data.width, MAX_WIDTH),
        MIN_WIDTH,
      );

      dispatch(setPropertyPaneWidthAction(newWidth));

      if (paneRef.current) {
        paneRef.current.style.width = `${newWidth}px`;
      }
    },
    [dispatch, width],
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
