import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useState } from "react";
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";
import styled from "styled-components";

const SimpleContainer = styled.div`
  position: auto;
  width: fit-content;
  height: fit-content;
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
  shouldObserveHeight: boolean;
  shouldObserveWidth: boolean;
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
    if (currentDimension.width === 0) return;

    const padding = WIDGET_PADDING * 2;
    const widthDiff = Math.abs(props.width - currentDimension.width - padding);

    if (
      (widthDiff >= 1 && props.shouldObserveWidth) ||
      props.width < props.minWidth
    )
      onDimensionUpdate(currentDimension.width, currentDimension.height);
  }, [props.width, currentDimension.width]);

  useEffect(() => {
    if (currentDimension.height === 0) return;

    const padding = WIDGET_PADDING * 2;
    const heightDiff = Math.abs(
      props.height - currentDimension.height - padding,
    );

    if (
      (heightDiff >= 1 && props.shouldObserveHeight) ||
      props.height < props.minHeight
    )
      onDimensionUpdate(currentDimension.width, currentDimension.height);
  }, [props.height, currentDimension.height]);

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
