import { useContext } from "react";
import type { PropsWithChildren } from "react";
import React, { useEffect, useRef, useState } from "react";
import {
  GridDefaults,
  WidgetHeightLimits,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import styled from "styled-components";
import type { WidgetProps } from "widgets/BaseWidget";
import { shouldUpdateWidgetHeightAutomatically } from "widgets/WidgetUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";

const StyledAutoHeightContainer = styled.div<{ isOverflow?: boolean }>`
  overflow-y: ${(props) => (props.isOverflow ? "auto" : "unset")};
  overflow-x: ${(props) => (props.isOverflow ? "hidden" : "unset")};
  padding-right: 4px;
  height: 100%;
`;

const CenterContainer = styled.div<{ shouldBeCentered: boolean }>`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: ${(props) => (props.shouldBeCentered ? "center" : "flex-start")};
`;

interface AutoHeightContainerProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
  isAutoHeightWithLimits: boolean;
  widgetHeightInPixels: number;
  widgetProps: WidgetProps;
}

const SimpleContainer = styled.div`
  height: auto !important;
  width: 100%;
`;

export default function AutoHeightContainer({
  children,
  isAutoHeightWithLimits,
  maxDynamicHeight,
  minDynamicHeight,
  widgetHeightInPixels,
  widgetProps,
}: PropsWithChildren<AutoHeightContainerProps>) {
  const [expectedHeight, setExpectedHeight] = useState(0);
  const unmountingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLDivElement>(null);
  const { updateWidgetAutoHeight } = useContext(EditorContext);

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;

      if (height) {
        setExpectedHeight(height);
      } else {
        //setting timeout if height is 0
        unmountingTimeout.current = setTimeout(() => {
          setExpectedHeight(height);
        }, 0);
      }
    }),
  );

  const onHeightUpdate = (height: number): void => {
    const paddedHeight =
      Math.ceil(
        Math.ceil(height + WIDGET_PADDING * 2) /
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      ) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    const shouldUpdate = shouldUpdateWidgetHeightAutomatically(
      paddedHeight,
      widgetProps,
    );

    if (updateWidgetAutoHeight) {
      const { widgetId } = widgetProps;

      shouldUpdate && updateWidgetAutoHeight(widgetId, paddedHeight);
    }
  };

  useEffect(() => {
    if (ref.current) {
      observer.current.observe(ref.current);
    }

    return () => {
      // clearing out timeout if the component is unMounting
      unmountingTimeout.current && clearTimeout(unmountingTimeout.current);
      observer.current.disconnect();
    };
  }, []);

  useEffect(() => {
    onHeightUpdate(expectedHeight);
  }, [expectedHeight, minDynamicHeight, maxDynamicHeight]);

  useEffect(() => {
    if (
      widgetHeightInPixels !==
      Math.ceil(
        Math.ceil(expectedHeight + WIDGET_PADDING * 2) /
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      ) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    ) {
      onHeightUpdate(expectedHeight);
    }
  }, [widgetHeightInPixels]);

  const shouldBeCentered =
    widgetHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT ===
      minDynamicHeight &&
    minDynamicHeight === WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;

  if (isAutoHeightWithLimits) {
    const expectedHeightInRows = Math.ceil(
      expectedHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    );

    const backgroundColor =
      widgetProps?.type === "TEXT_WIDGET"
        ? widgetProps?.backgroundColor
        : undefined;

    return (
      <StyledAutoHeightContainer
        className="auto-height-scroll-container"
        isOverflow={maxDynamicHeight < expectedHeightInRows}
        style={{ backgroundColor }}
      >
        <CenterContainer
          data-testid={`t--centered-${widgetProps.widgetName}-${widgetProps.widgetId}`}
          shouldBeCentered={shouldBeCentered}
        >
          <SimpleContainer className="auto-height-container" ref={ref}>
            {children}
          </SimpleContainer>
        </CenterContainer>
      </StyledAutoHeightContainer>
    );
  }

  return (
    <CenterContainer
      data-testid={`t--centered-${widgetProps.widgetName}-${widgetProps.widgetId}`}
      shouldBeCentered={shouldBeCentered}
    >
      <SimpleContainer className="auto-height-container" ref={ref}>
        {children}
      </SimpleContainer>
    </CenterContainer>
  );
}
