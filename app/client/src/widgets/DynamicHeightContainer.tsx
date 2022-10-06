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
  dynamicHeight: string;
  onHeightUpdate: (height: number) => void;
}

export default function DynamicHeightContainer({
  children,
  dynamicHeight,
  maxDynamicHeight,
  onHeightUpdate,
}: PropsWithChildren<DynamicHeightContainerProps>) {
  const isAutoHeightWithLimits =
    dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;

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

    return (
      <StyledDynamicHeightContainer
        isOverflow={maxDynamicHeight < expectedHeightInRows}
      >
        <div ref={ref} style={{ height: "auto" }}>
          {children}
        </div>
      </StyledDynamicHeightContainer>
    );
  }

  return (
    <div ref={ref} style={{ height: "auto" }}>
      {children}
    </div>
  );
}
