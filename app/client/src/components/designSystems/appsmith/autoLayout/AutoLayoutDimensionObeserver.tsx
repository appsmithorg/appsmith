import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useState } from "react";
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";
import styled from "styled-components";

const SimpleContainer = styled.div`
  width: fit-content;
  &.fill-widget {
    width: 100%;
  }
`;

interface AutoLayoutDimensionObserverProps {
  height: number;
  isFillWidget: boolean;
  minHeight: number;
  minWidth: number;
  onDimensionUpdate: (width: number, height: number) => void;
  type: string;
  width: number;
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

  useEffect(() => {
    /**
     * BUTTON_WIDGET is a special case
     * as the component tries to preserve it's width on all viewports.
     * So bounding box must be adjusted to the component's width.
     */
    if (
      props.type === "BUTTON_WIDGET" &&
      props.width !== currentDimension.width + WIDGET_PADDING * 2
    )
      onDimensionUpdate(currentDimension.width, currentDimension.height);
    /**
     * Top down data flow (from store to widget) (Canvas resizing / adding more widgets in the same row)
     * Only updated when min size is violated or
     * bounding box is larger than component size.
     */
    if (
      props.width < props.minWidth ||
      props.height < props.minHeight ||
      props.width > currentDimension.width + WIDGET_PADDING * 2
    ) {
      onDimensionUpdate(currentDimension.width, currentDimension.height);
    }
  }, [props.width, props.height]);

  useEffect(() => {
    /**
     * Component dimensions have changed first.
     * Bottom up data flow (from widget to store)
     * Always update the store with the latest dimensions.
     */
    onDimensionUpdate(currentDimension.width, currentDimension.height);
  }, [currentDimension.width, currentDimension.height]);

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
        props.isFillWidget ? "fill-widget" : ""
      }`}
      ref={ref}
    >
      {props.children}
    </SimpleContainer>
  );
}
