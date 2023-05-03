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
  onDimensionUpdate: (width: number, height: number) => void;
  width: number;
  height: number;
  isFillWidget: boolean;
  minWidth: number;
  minHeight: number;
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
    // Top down data flow (from store to widget) (Canvas resizing / adding more widgets in the same row)
    // Only updated when min size violated or
    // bounding box is larger than component size (Button widget)
    if (
      props.width < props.minWidth ||
      props.height < props.minHeight ||
      props.width > currentDimension.width + WIDGET_PADDING * 2
    ) {
      onDimensionUpdate(currentDimension.width, currentDimension.height);
    }
  }, [props.width, props.height]);

  useEffect(() => {
    // Component dimensions have changed first.
    // Bottom up data flow (from widget to store)
    // Always updated
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
