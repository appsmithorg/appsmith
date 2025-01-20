import React from "react";
import styled from "styled-components";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import { DEFAULT_PROPERTY_PANE_WIDTH } from "constants/AppConstants";

const EXPANDED_PROPERTY_PANE_WIDTH = 500;

const ResizeHandle = styled.div<{ isExpanded?: boolean }>`
  position: absolute;
  left: -${WIDGET_PADDING}px;
  top: 0;
  width: ${2 * WIDGET_PADDING}px;
  height: 100%;
  cursor: ${(props) => (props.isExpanded ? "e-resize" : "w-resize")};
  transition: background-color 0.1s ease-in;
  z-index: 999;

  &:hover {
    background-color: var(--ads-v2-color-bg-muted);
  }
`;

const ResizableContainer = styled.div<{ width: number }>`
  position: relative;
  height: 100%;
  width: ${(props) => props.width}px;
  transition: width 0.2s ease-in-out;
`;

interface PropertyPaneResizableHandleProps {
  children: React.ReactNode;
}

export function PropertyPaneResizableHandle({
  children,
}: PropertyPaneResizableHandleProps) {
  const dispatch = useDispatch();
  const width = useSelector(getPropertyPaneWidth);

  const handleClick = React.useCallback(() => {
    const newWidth =
      width === DEFAULT_PROPERTY_PANE_WIDTH
        ? EXPANDED_PROPERTY_PANE_WIDTH
        : DEFAULT_PROPERTY_PANE_WIDTH;

    dispatch(setPropertyPaneWidthAction(newWidth));
  }, [dispatch, width]);

  const isExpanded = width === EXPANDED_PROPERTY_PANE_WIDTH;

  return (
    <ResizableContainer width={width}>
      <ResizeHandle isExpanded={isExpanded} onClick={handleClick} />
      {children}
    </ResizableContainer>
  );
}
