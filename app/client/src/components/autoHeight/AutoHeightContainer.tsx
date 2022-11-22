import React, { PropsWithChildren, useEffect, useRef } from "react";
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";

const StyledAutoHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
  overflow-x: ${(props) => (props.isOverflow ? "hidden" : "unset")};
  padding-right: 4px;
`;

interface AutoHeightContainerProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
  isAutoHeightWithLimits: boolean;
  onHeightUpdate: (height: number) => void;
  widgetHeightInPixels: number;
  widgetProps?: WidgetProps;
}

const SimpleContainer = styled.div`
  height: auto !important;
`;

export default function AutoHeightContainer({
  children,
  isAutoHeightWithLimits,
  maxDynamicHeight,
  minDynamicHeight,
  onHeightUpdate,
  widgetHeightInPixels,
  widgetProps,
}: PropsWithChildren<AutoHeightContainerProps>) {
  const expectedHeight = useRef(0);

  const ref = useRef<HTMLDivElement>(null);

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      expectedHeight.current = height;
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
    onHeightUpdate(expectedHeight.current);
  }, [minDynamicHeight, maxDynamicHeight]);

  useEffect(() => {
    if (
      widgetHeightInPixels !==
      Math.ceil(
        (expectedHeight.current + WIDGET_PADDING * 2) /
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      ) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    ) {
      onHeightUpdate(expectedHeight.current);
    }
  }, [widgetHeightInPixels]);

  if (isAutoHeightWithLimits) {
    const expectedHeightInRows = Math.ceil(
      expectedHeight.current / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    );

    const backgroundColor = widgetProps?.backgroundColor;

    return (
      <StyledAutoHeightContainer
        className="auto-height-scroll-container"
        isOverflow={maxDynamicHeight < expectedHeightInRows}
        style={{ backgroundColor }}
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
