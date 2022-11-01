import React, { PropsWithChildren, useRef, useEffect, useState } from "react";
import { GridDefaults } from "constants/WidgetConstants";
import styled from "styled-components";

const StyledAutoHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
  overflow-x: ${(props) => (props.isOverflow ? "hidden" : "unset")};
`;

interface AutoHeightContainerProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
  isAutoHeightWithLimits: boolean;
  onHeightUpdate: (height: number) => void;
}

const SimpleContainer = styled.div`
  height: auto;
`;

export default function AutoHeightContainer({
  children,
  isAutoHeightWithLimits,
  maxDynamicHeight,
  minDynamicHeight,
  onHeightUpdate,
}: PropsWithChildren<AutoHeightContainerProps>) {
  const [expectedHeight, setExpectedHeight] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const observer = useRef(
    new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      setExpectedHeight(height);
      onHeightUpdate(height);
    }),
  );

  useEffect(() => {
    if (ref.current) {
      observer.current.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.current.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    onHeightUpdate(expectedHeight);
  }, [minDynamicHeight, maxDynamicHeight]);

  if (isAutoHeightWithLimits) {
    const expectedHeightInRows = Math.ceil(
      expectedHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    );

    return (
      <StyledAutoHeightContainer
        className="auto-height-scroll-container"
        isOverflow={maxDynamicHeight < expectedHeightInRows}
      >
        <SimpleContainer className="auto-height-container" ref={ref}>
          {children}
        </SimpleContainer>
      </StyledAutoHeightContainer>
    );
  }

  return (
    <SimpleContainer className="auto-height-container" ref={ref}>
      {children}
    </SimpleContainer>
  );
}
