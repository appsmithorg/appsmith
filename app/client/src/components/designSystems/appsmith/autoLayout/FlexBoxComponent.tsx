import React, { ReactNode, useMemo } from "react";
import styled from "styled-components";
import { isArray } from "lodash";

import {
  AlignItems,
  Alignment,
  FlexDirection,
  FlexLayerAlignment,
  JustifyContent,
  LayoutDirection,
  Overflow,
  Spacing,
} from "components/constants";
import { getLayoutProperties } from "utils/layoutPropertiesUtils";
import AutoLayoutLayer from "./AutoLayoutLayer";

export interface FlexBoxProps {
  alignment: Alignment;
  direction?: LayoutDirection;
  spacing: Spacing;
  stretchHeight: boolean;
  useAutoLayout: boolean;
  children?: ReactNode;
  widgetId: string;
  overflow: Overflow;
  flexLayers: FlexLayer[];
}

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
  hasFillChild?: boolean;
}

export const FlexContainer = styled.div<{
  useAutoLayout?: boolean;
  flexDirection?: FlexDirection;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  stretchHeight: boolean;
  overflow: Overflow;
}>`
  display: ${({ useAutoLayout }) => (useAutoLayout ? "flex" : "block")};
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  flex-wrap: ${({ overflow }) =>
    overflow?.indexOf("wrap") > -1 ? overflow : "nowrap"};

  width: 100%;
  height: ${({ stretchHeight }) => (stretchHeight ? "100%" : "auto")};

  overflow: ${({ overflow }) =>
    overflow?.indexOf("wrap") === -1 ? overflow : "hidden"};
  padding: 4px;
`;

function FlexBoxComponent(props: FlexBoxProps) {
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;

  const layoutProps = useMemo(
    () => getLayoutProperties(props.direction, props.alignment, props.spacing),
    [props.direction, props.alignment, props.spacing],
  );

  const renderChildren = () => {
    if (!props.children) return null;
    if (
      !props.useAutoLayout ||
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    )
      return props.children;
    /**
     * Wrap children of a Vertical Stack in a flex layer.
     */
    const map: { [key: string]: any } = {};
    if (isArray(props.children)) {
      for (const child of props.children) {
        map[(child as JSX.Element).props?.widgetId] = child;
      }
    }
    return props.flexLayers.map((layer: FlexLayer, index: number) => {
      const { children, hasFillChild } = layer;
      if (!children || !children.length) return null;
      const start = [],
        center = [],
        end = [];
      for (const child of children) {
        const widget = map[child.id];
        if (hasFillChild) {
          start.push(widget);
          continue;
        }
        if (child.align === "end") end.push(widget);
        else if (child.align === "center") center.push(widget);
        else start.push(widget);
      }
      return (
        <AutoLayoutLayer
          center={center}
          direction={direction}
          end={end}
          hasFillChild={layer.hasFillChild}
          index={index}
          key={index}
          start={start}
          widgetId={props.widgetId}
        />
      );
    });
  };
  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      {...layoutProps}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      <>{renderChildren()}</>
    </FlexContainer>
  );
}

export default FlexBoxComponent;
