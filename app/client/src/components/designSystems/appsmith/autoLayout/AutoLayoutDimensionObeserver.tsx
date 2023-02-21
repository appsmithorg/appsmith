import { FLEXBOX_PADDING } from "constants/WidgetConstants";
import React, { useState } from "react";
import { PropsWithChildren, useEffect, useRef } from "react";
import styled from "styled-components";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { WidgetProps } from "widgets/BaseWidget";

const SimpleContainer = styled.div`
  width: fit-content;
  &.fill-widget {
    width: 100%;
  }
`;

interface AutoLayoutDimensionObserverProps {
  onDimensionUpdate: (width: number, height: number) => void;
  widgetProps: WidgetProps;
}

export default function AutoLayoutDimensionObserver(
  props: PropsWithChildren<AutoLayoutDimensionObserverProps>,
) {
  const { onDimensionUpdate } = props;
  const [currentDimension, setCurrentDimension] = useState({
    width: 0,
    height: 0,
  });

  const ref = useRef<HTMLDivElement>(null);

  const observer = useRef(
    new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;
      if (width === 0 || height === 0) return;
      setCurrentDimension({ width, height });
    }),
  );

  const boundingBoxWidth =
    (props.widgetProps.rightColumn - props.widgetProps.leftColumn) *
      props.widgetProps.parentColumnSpace -
    2 * FLEXBOX_PADDING;

  const boundingBoxHeight =
    (props.widgetProps.bottomRow - props.widgetProps.topRow) *
      props.widgetProps.parentRowSpace -
    2 * FLEXBOX_PADDING;

  useEffect(() => {
    const widthDiff = Math.abs(boundingBoxWidth - currentDimension.width);
    const heightDiff = Math.abs(boundingBoxHeight - currentDimension.height);
    if (currentDimension.width === 0 || currentDimension.height === 0) return;
    if (widthDiff > 2 || heightDiff > 2) {
      onDimensionUpdate(currentDimension.width, currentDimension.height);
    }
  }, [
    boundingBoxWidth,
    boundingBoxHeight,
    currentDimension.width,
    currentDimension.height,
  ]);

  useEffect(() => {
    if (ref.current) {
      observer.current.observe(ref.current);
    }

    return () => {
      observer.current.disconnect();
    };
  }, []);

  return (
    <SimpleContainer
      className={`auto-layout-dimension-observer ${
        props.widgetProps.responsiveBehavior === ResponsiveBehavior.Fill
          ? "fill-widget"
          : ""
      }`}
      ref={ref}
    >
      {props.children}
    </SimpleContainer>
  );
}
