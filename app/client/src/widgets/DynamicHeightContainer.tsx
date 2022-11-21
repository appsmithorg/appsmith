import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";
import styled from "styled-components";
import { DynamicHeight } from "utils/WidgetFeatures";
import { WidgetProps } from "./BaseWidget";

const StyledDynamicHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
  overflow-x: ${(props) => (props.isOverflow ? "hidden" : "unset")};
  padding-right: 4px;
`;

interface DynamicHeightContainerProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
  dynamicHeight: string;
  onHeightUpdate: (height: number) => void;
  widgetHeightInPixels: number;
  widgetProps?: WidgetProps;
}

export default function DynamicHeightContainer({
  children,
  dynamicHeight,
  maxDynamicHeight,
  minDynamicHeight,
  onHeightUpdate,
  widgetHeightInPixels,
  widgetProps,
}: PropsWithChildren<DynamicHeightContainerProps>) {
  const isAutoHeightWithLimits =
    dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;

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
  }, [observer]);

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
      <StyledDynamicHeightContainer
        isOverflow={maxDynamicHeight < expectedHeightInRows}
        style={{ backgroundColor }}
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
