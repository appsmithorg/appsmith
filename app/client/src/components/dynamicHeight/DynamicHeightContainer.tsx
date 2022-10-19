import React, { PropsWithChildren, useRef, useState } from "react";
import { GridDefaults } from "constants/WidgetConstants";
import styled from "styled-components";
import { DynamicHeight } from "utils/WidgetFeatures";

const StyledDynamicHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
  overflow-x: ${(props) => (props.isOverflow ? "hidden" : "unset")};
`;

interface DynamicHeightContainerProps {
  maxDynamicHeight: number;
  isAutoHeightWithLimits: boolean;
  onHeightUpdate: (height: number) => void;
}

const SimpleContainer = styled.div`
  height: auto;
`;

export default function DynamicHeightContainer({
  children,
  isAutoHeightWithLimits,
  maxDynamicHeight,
  onHeightUpdate,
}: PropsWithChildren<DynamicHeightContainerProps>) {
  const [expectedHeight, setExpectedHeight] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      setExpectedHeight(height);
      onHeightUpdate(height);
    }),
  );

  React.useEffect(() => {
    if (ref.current) {
      observer.current.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.current.unobserve(ref.current);
      }
    };
  }, [observer]);

  if (isAutoHeightWithLimits) {
    const expectedHeightInRows = Math.ceil(
      expectedHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    );

    console.log("expectedHeightInRows", expectedHeightInRows);

    return (
      <StyledDynamicHeightContainer
        className="auto-height-scroll-container"
        isOverflow={maxDynamicHeight < expectedHeightInRows}
      >
        <SimpleContainer className="auto-height-container" ref={ref}>
          {children}
        </SimpleContainer>
      </StyledDynamicHeightContainer>
    );
  }

  return (
    <SimpleContainer className="auto-height-container" ref={ref}>
      {children}
    </SimpleContainer>
  );
}
