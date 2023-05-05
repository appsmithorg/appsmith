import type { AppState } from "ce/reducers";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useState } from "react";
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";
import { useSelector } from "react-redux";
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
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
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
    if (currentDimension.width === 0 || isAutoCanvasResizing) return;
    const padding = WIDGET_PADDING * 2;
    const widthDiff = Math.abs(props.width - currentDimension.width - padding);
    if (widthDiff >= 1 && props.type === "BUTTON_WIDGET")
      onDimensionUpdate(currentDimension.width, currentDimension.height);
    if (props.width < props.minWidth)
      onDimensionUpdate(currentDimension.width, currentDimension.height);
  }, [props.width, currentDimension.width]);

  useEffect(() => {
    if (currentDimension.height === 0 || isAutoCanvasResizing) return;
    const padding = WIDGET_PADDING * 2;
    const heightDiff = Math.abs(
      props.height - currentDimension.height - padding,
    );
    if (heightDiff >= 1)
      onDimensionUpdate(currentDimension.width, currentDimension.height);
  }, [props.height, currentDimension.height]);

  useEffect(() => {
    // Don't observe when the canvas is resizing.
    if (ref.current) {
      if (!isAutoCanvasResizing) observer.current.observe(ref.current);
      else observer.current.unobserve(ref.current);
    }
  }, [isAutoCanvasResizing]);

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
