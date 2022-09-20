import React, { PropsWithChildren, useRef, useState } from "react";
import { GridDefaults } from "constants/WidgetConstants";
import styled from "styled-components";

const StyledDynamicHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
`;

interface DynamicHeightContainerProps {
  maxDynamicHeight: number;
}

export default function DynamicHeightContainer({
  children,
  maxDynamicHeight,
}: PropsWithChildren<DynamicHeightContainerProps>) {
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
