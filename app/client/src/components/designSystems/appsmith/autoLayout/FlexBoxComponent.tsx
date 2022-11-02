import { isArray } from "lodash";
import React, { ReactNode } from "react";
import styled from "styled-components";

import { AppState } from "ce/reducers";
import {
  FlexLayerAlignment,
  LayoutDirection,
  Overflow,
} from "components/constants";
import { APP_MODE } from "entities/App";
import { useSelector } from "react-redux";
import { getAppMode } from "selectors/entitiesSelector";
import { getIsMobile } from "selectors/mainCanvasSelectors";
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
  leaveSpaceForWidgetName: boolean;
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
  height: ${({ isMainContainer, stretchHeight }) =>
    isMainContainer || stretchHeight ? "100%" : "auto"};

  overflow: hidden;
  overflow-y: ${({ isMainContainer, isMobile }) =>
    isMainContainer || isMobile ? "auto" : "hidden"};

  padding: ${({ leaveSpaceForWidgetName }) =>
    leaveSpaceForWidgetName ? "4px 4px 22px 4px;" : "4px;"};
`;

const DEFAULT_HIGHLIGHT_SIZE = 4;

export const DropPosition = styled.div<{
  isDragging: boolean;
  isVertical: boolean;
}>`
  width: ${({ isVertical }) =>
    isVertical ? `${DEFAULT_HIGHLIGHT_SIZE}px` : "100%"};
  height: ${({ isVertical }) =>
    isVertical ? "auto" : `${DEFAULT_HIGHLIGHT_SIZE}px`};
  background-color: rgba(223, 158, 206, 0.6);
  margin: 2px;
  display: ${({ isDragging }) => (isDragging ? "block" : "none")};
`;

function FlexBoxComponent(props: FlexBoxProps) {
  // TODO: set isMobile as a prop at the top level
  const isMobile = useSelector(getIsMobile);
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;
  const appMode = useSelector(getAppMode);
  const leaveSpaceForWidgetName = appMode === APP_MODE.EDIT;
  const { autoLayoutDragDetails, dragDetails } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

  const isCurrentCanvasDragging = dragDetails?.draggedOn === props.widgetId;

  const draggedWidgets: string[] = isArray(autoLayoutDragDetails)
    ? autoLayoutDragDetails.map((each) => each.widgetId)
    : [];

  const renderChildren = () => {
    if (!props.children) return null;
    if (!props.useAutoLayout) return props.children;
    if (
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    ) {
      if (isCurrentCanvasDragging && draggedWidgets?.length)
        return ((props.children as any) || [])?.filter(
          (child: any) =>
            draggedWidgets?.indexOf((child as JSX.Element).props.widgetId) ===
            -1,
        );
      return props.children;
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

    const layers: any[] = processLayers(map);

    return layers;
  };

  function DropPositionComponent(props: {
    isVertical: boolean;
    alignment: FlexLayerAlignment;
    layerIndex: number;
    childIndex: number;
    widgetId: string;
  }) {
    return (
      <DropPosition
        className={`t--drop-position-${props.widgetId} alignment-${props.alignment} layer-index-${props.layerIndex} child-index-${props.childIndex}`}
        isDragging={isCurrentCanvasDragging}
        isVertical={props.isVertical}
      />
    );
  }

  const getDropPositionKey = (
    index: number,
    alignment: FlexLayerAlignment,
    layerIndex: number,
  ): string =>
    `drop-layer-${props.widgetId}-${layerIndex}-${alignment}-${index}`;

  const addDropPositions = (
    arr: any[],
    childCount: number,
    layerIndex: number,
    alignment: FlexLayerAlignment,
    isVertical: boolean,
  ): any[] => {
    const res = [
      <DropPositionComponent
        alignment={alignment}
        childIndex={childCount}
        isVertical={isVertical}
        key={getDropPositionKey(0, alignment, layerIndex)}
        layerIndex={layerIndex}
        widgetId={props.widgetId}
      />,
    ];
    let count = 0;
    if (arr) {
      for (const item of arr) {
        count += 1;
        res.push(item);
        res.push(
          <DropPositionComponent
            alignment={alignment}
            childIndex={childCount + count}
            isVertical={isVertical}
            key={getDropPositionKey(0, alignment, layerIndex)}
            layerIndex={layerIndex}
            widgetId={props.widgetId}
          />,
        );
      }
    }
    return res;
  };

  function processLayers(map: { [key: string]: any }) {
    let childCount = 0;
    const layers = [
      <DropPositionComponent
        alignment={FlexLayerAlignment.Start}
        childIndex={0}
        isVertical={false}
        key={getDropPositionKey(
          Math.ceil(Math.random() * 100),
          FlexLayerAlignment.Start,
          0,
        )}
        layerIndex={0}
        widgetId={props.widgetId}
      />,
    ];
    props.flexLayers?.map((layer: FlexLayer, index: number) => {
      const { children, hasFillChild } = layer;
      let count = 0;
      let start = [],
        center = [],
        end = [];
      if (!children || !children.length) return null;

      for (const child of children) {
        count += 1;
        const widget = map[child.id];
        if (hasFillChild) {
          start.push(widget);
          continue;
        }
        if (child.align === "end") end.push(widget);
        else if (child.align === "center") center.push(widget);
        else start.push(widget);
      }
      /**
       * Add drop positions
       */
      start = addDropPositions(
        start,
        childCount,
        index,
        FlexLayerAlignment.Start,
        true,
      );
      center = addDropPositions(
        center,
        childCount,
        index,
        FlexLayerAlignment.Center,
        true,
      );
      end = addDropPositions(
        end,
        childCount,
        index,
        FlexLayerAlignment.End,
        true,
      );

      const res = (
        <AutoLayoutLayer
          center={center}
          currentChildCount={childCount}
          direction={direction}
          end={end}
          hasFillChild={layer.hasFillChild}
          index={index}
          isCurrentCanvasDragging={isCurrentCanvasDragging}
          isMobile={isMobile}
          key={index}
          start={start}
          widgetId={props.widgetId}
        />
      );
      childCount += count;
      layers.push(res);
      layers.push(
        <DropPositionComponent
          alignment={FlexLayerAlignment.Start}
          childIndex={childCount}
          isVertical={false}
          key={getDropPositionKey(
            Math.ceil(Math.random() * 100),
            FlexLayerAlignment.Start,
            index,
          )}
          layerIndex={index}
          widgetId={props.widgetId}
        />,
      );
      return res;
    });
    return layers;
    // ?.filter((layer) => layer !== null);
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
      leaveSpaceForWidgetName={leaveSpaceForWidgetName}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      <>{renderChildren()}</>
    </FlexContainer>
  );
}

export default FlexBoxComponent;
