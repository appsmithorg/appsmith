import React, { ReactNode } from "react";
import styled from "styled-components";
import { isArray } from "lodash";

import { AppState } from "ce/reducers";
import {
  FlexLayerAlignment,
  LayoutDirection,
  Overflow,
} from "components/constants";
import { useSelector } from "react-redux";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
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
  isMobile?: boolean;
  isMainContainer: boolean;
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

  overflow: "hidden";
  overflow-y: ${({ isMainContainer, isMobile }) =>
    isMainContainer || isMobile ? "auto" : "hidden"};
  padding: 4px;
`;

function FlexBoxComponent(props: FlexBoxProps) {
  // TODO: set isMobile as a prop at the top level
  const isMobile = useIsMobileDevice();
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;

  const { autoLayoutDragDetails, dragDetails, flexHighlight } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

  const isCurrentCanvasDragging = dragDetails?.draggedOn === props.widgetId;

  const draggedWidgets: string[] = isArray(autoLayoutDragDetails)
    ? autoLayoutDragDetails.map((each) => each.widgetId)
    : [];

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
    if (!props.useAutoLayout) return props.children;
    if (
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    ) {
      if (flexHighlight && isCurrentCanvasDragging) {
        const previewNode = getPreviewNode();
        const filteredChildren = (props.children as any)?.filter(
          (child: any) => {
            return (
              draggedWidgets.indexOf(
                (child as JSX.Element)?.props?.widgetId,
              ) === -1
            );
          },
        );
        return addInPosition(
          filteredChildren,
          flexHighlight?.index,
          previewNode,
        );
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

    const previewNode = getPreviewNode();
    const layers: any[] = processLayers(map, previewNode);

    if (flexHighlight?.isNewLayer && isCurrentCanvasDragging) {
      return addInPosition(
        layers,
        flexHighlight.layerIndex !== undefined
          ? flexHighlight.layerIndex
          : layers.length,
        <AutoLayoutLayer
          center={[]}
          direction={direction}
          end={[]}
          hasFillChild={false}
          index={layers.length}
          isMobile={isMobile}
          key={layers.length}
          start={[previewNode]}
          widgetId={props.widgetId}
        />,
      );
    }

    return layers;
  };

  function processLayers(map: { [key: string]: any }, previewNode: any) {
    return props.flexLayers
      ?.map((layer: FlexLayer, index: number) => {
        const { children, hasFillChild } = layer;
        let start = [],
          center = [],
          end = [];
        if (!children || !children.length) return null;

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

        if (
          isCurrentCanvasDragging &&
          !flexHighlight?.isNewLayer &&
          index === flexHighlight?.layerIndex
        ) {
          const pos = flexHighlight?.rowIndex || 0;
          if (flexHighlight?.alignment === "start")
            start = addInPosition(start, pos, previewNode);
          else if (flexHighlight?.alignment === "center")
            center = addInPosition(center, pos, previewNode);
          else if (flexHighlight?.alignment === "end")
            end = addInPosition(end, pos, previewNode);
        }

        return (
          <AutoLayoutLayer
            center={center}
            direction={direction}
            end={end}
            hasFillChild={layer.hasFillChild}
            index={index}
            isMobile={isMobile}
            key={index}
            start={start}
            widgetId={props.widgetId}
          />
        );
      })
      ?.filter((layer) => layer !== null);
  }

  function addInPosition(arr: any[], index: number, item: any): any[] {
    return [...arr.slice(0, index), item, ...arr.slice(index)];
  }

  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      direction={direction}
      isMainContainer={props.widgetId === "0"}
      isMobile={isMobile}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      <>{renderChildren()}</>
    </FlexContainer>
  );
}

export default FlexBoxComponent;
