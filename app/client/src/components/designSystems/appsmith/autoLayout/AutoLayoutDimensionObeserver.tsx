import React from "react";
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

  const ref = useRef<HTMLDivElement>(null);

  const observer = useRef(
    new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;
      if (width === 0 || height === 0) return;
      onDimensionUpdate(width, height);
    }),
  );

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
