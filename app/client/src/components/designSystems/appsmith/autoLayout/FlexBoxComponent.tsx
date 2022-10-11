import { isArray } from "lodash";
import React, { ReactNode } from "react";
import styled from "styled-components";

import { AppState } from "ce/reducers";
import {
  FlexLayerAlignment,
  LayoutDirection,
  Overflow,
} from "components/constants";
import { useSelector } from "react-redux";
import AutoLayoutLayer from "./AutoLayoutLayer";

export interface FlexBoxProps {
  direction?: LayoutDirection;
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
  direction?: LayoutDirection;
  stretchHeight: boolean;
  overflow: Overflow;
}>`
  display: ${({ useAutoLayout }) => (useAutoLayout ? "flex" : "block")};
  flex-direction: ${({ direction }) =>
    direction === LayoutDirection.Vertical ? "column" : "row"};
  justify-content: flex-start;
  align-items: flex-start;
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

  // const layoutProps = useMemo(
  //   () => getLayoutProperties(props.direction, props.alignment, props.spacing),
  //   [props.direction, props.alignment, props.spacing],
  // );
  const { autoLayoutDragDetails, dragDetails, flexHighlight } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

  const getPreviewNode = () => {
    return React.createElement(() => {
      const height = autoLayoutDragDetails
        ? autoLayoutDragDetails[0].height
        : 0;
      const width = autoLayoutDragDetails ? autoLayoutDragDetails[0].width : 0;

      return (
        <div
          style={{
            border: "1px dashed blue",
            height: `${height}px`,
            width: `${width}px`,
          }}
        />
      );
    });
  };

  const renderChildren = () => {
    if (!props.children) return null;
    if (
      !props.useAutoLayout ||
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    ) {
      if (flexHighlight && dragDetails.draggedOn === props.widgetId) {
        const previewNode = getPreviewNode();
        const totalChildren = (props.children as any).length;
        const allChildren = [
          ...(props.children as any).slice(0, flexHighlight?.index),
          previewNode,
          ...(props.children as any).slice(flexHighlight?.index, totalChildren),
        ];
        return allChildren;
      } else {
        return props.children;
      }
    }

    /**
     * Wrap children of a Vertical Stack in a flex layer.
     */
    const map: { [key: string]: any } = {};
    if (isArray(props.children)) {
      for (const child of props.children) {
        map[(child as JSX.Element).props?.widgetId] = child;
      }
    }

    const layers =
      flexHighlight?.isNewLayer && flexHighlight?.layerIndex
        ? [
            ...props.flexLayers.slice(0, flexHighlight?.index),
            { children: [], hasFillChild: false },
            ...props.flexLayers.slice(
              flexHighlight?.index,
              props.flexLayers.length,
            ),
          ]
        : props.flexLayers;
    let childCount = 0;
    return layers.map((layer: FlexLayer, index: number) => {
      const { children, hasFillChild } = layer;
      const start = [],
        center = [],
        end = [];
      if (!children || !children.length) {
        const previewNode = getPreviewNode();
        start.push(previewNode);
      }

      for (const child of children) {
        if (
          flexHighlight &&
          index === flexHighlight.layerIndex &&
          childCount === flexHighlight.index &&
          dragDetails.draggedOn === props.widgetId
        ) {
          const previewNode = getPreviewNode();
          if (flexHighlight.alignment === "start") {
            start.push(previewNode);
          } else if (flexHighlight.alignment === "center") {
            center.push(previewNode);
          } else {
            end.push(previewNode);
          }
        }
        childCount++;
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
      direction={direction}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      <>{renderChildren()}</>
    </FlexContainer>
  );
}

export default FlexBoxComponent;
