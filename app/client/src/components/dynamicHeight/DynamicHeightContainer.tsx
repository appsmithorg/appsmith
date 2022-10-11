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
}

function WithLimitsContainer({
  children,
  maxDynamicHeight,
}: PropsWithChildren<{ maxDynamicHeight: number }>) {
  const [expectedHeight, setExpectedHeight] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      setExpectedHeight(entries[0].contentRect.height);
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

export default function DynamicHeightContainer({
  children,
  dynamicHeight,
  maxDynamicHeight,
}: PropsWithChildren<DynamicHeightContainerProps>) {
  const isAutoHeightWithLimits =
    dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;

  if (isAutoHeightWithLimits) {
    return (
      <WithLimitsContainer maxDynamicHeight={maxDynamicHeight}>
        {children}
      </WithLimitsContainer>
    );
  }

  return <div style={{ height: "auto" }}>{children}</div>;
}
