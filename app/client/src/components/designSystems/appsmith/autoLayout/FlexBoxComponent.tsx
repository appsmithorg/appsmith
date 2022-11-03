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
    isVertical ? `${DEFAULT_HIGHLIGHT_SIZE}px` : "calc(100% - 4px)"};
  height: ${({ isVertical }) =>
    isVertical ? "auto" : `${DEFAULT_HIGHLIGHT_SIZE}px`};
  background-color: rgba(223, 158, 206, 0.6);
  margin: 2px;
  display: ${({ isDragging }) => (isDragging ? "block" : "none")};
`;

export const NewLayerStyled = styled.div<{
  isDragging: boolean;
}>`
  width: 100%;

  div:nth-child(1) {
    display: ${({ isDragging }) => (isDragging ? "block" : "none")};
  }
  div:nth-child(2) {
    display: none;
  }
  .selected div:nth-child(1) {
    display: none;
  }
  .selected div:nth-child(2) {
    display: ${({ isDragging }) => (isDragging ? "block" : "none")};
  }
`;

function FlexBoxComponent(props: FlexBoxProps) {
  // TODO: set isMobile as a prop at the top level
  const isMobile = useSelector(getIsMobile);
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;
  const appMode = useSelector(getAppMode);
  const leaveSpaceForWidgetName = appMode === APP_MODE.EDIT;
  const { dragDetails } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );
  // TODO: Add support for multiple dragged widgets
  const draggedWidget = dragDetails?.draggingGroupCenter?.widgetId;

  const isCurrentCanvasDragging = dragDetails?.draggedOn === props.widgetId;

  const renderChildren = () => {
    if (!props.children) return null;
    if (!props.useAutoLayout) return props.children;
    if (
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    ) {
      if (isCurrentCanvasDragging && draggedWidget)
        return ((props.children as any) || [])?.filter(
          (child: any) =>
            draggedWidget !== (child as JSX.Element)?.props?.widgetId,
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

    const layers: any[] = cleanLayers(processLayers(map));

    return layers;
  };

  function cleanLayers(layers: any[]): any[] {
    if (!layers) return [];
    const set = new Set();
    return layers.filter((layer) => {
      const key = (layer as JSX.Element).key as string;
      const flag = set.has(key);
      set.add(key);
      return !flag;
    });
  }

  function DropPositionComponent(props: {
    isVertical: boolean;
    alignment: FlexLayerAlignment;
    layerIndex: number;
    childIndex: number;
    widgetId: string;
    isNewLayer: boolean;
  }) {
    return (
      <DropPosition
        className={`t--drop-position-${props.widgetId} alignment-${
          props.alignment
        } layer-index-${props.layerIndex} child-index-${props.childIndex} ${
          props.isVertical ? "isVertical" : "isHorizontal"
        } ${props.isNewLayer ? "isNewLayer" : ""}`}
        isDragging={isCurrentCanvasDragging}
        isVertical={props.isVertical}
      />
    );
  }

  function NewLayerComponent(props: {
    alignment: FlexLayerAlignment;
    childCount: number;
    layerIndex: number;
    isDragging: boolean;
    isNewLayer: boolean;
    isVertical: boolean;
    map: { [key: string]: any };
    widgetId: string;
  }): JSX.Element {
    const {
      alignment,
      childCount,
      isDragging,
      isNewLayer,
      isVertical,
      layerIndex,
      map,
      widgetId,
    } = props;
    return (
      <NewLayerStyled
        className="selected"
        id={`new-layer-${widgetId}-${layerIndex}`}
        isDragging={isDragging}
      >
        <DropPositionComponent
          alignment={alignment}
          childIndex={childCount}
          isNewLayer={isNewLayer}
          isVertical={isVertical}
          key={getDropPositionKey(0, alignment, layerIndex, false)}
          layerIndex={layerIndex}
          widgetId={widgetId}
        />
        <div>
          {
            processIndividualLayer(
              { children: [], hasFillChild: false },
              childCount,
              layerIndex,
              map,
              true,
            ).element
          }
        </div>
      </NewLayerStyled>
    );
  }

  const getDropPositionKey = (
    index: number,
    alignment: FlexLayerAlignment,
    layerIndex: number,
    isVertical: boolean,
  ): string =>
    `drop-layer-${props.widgetId}-${layerIndex}-${alignment}-${index}-${
      isVertical ? "vertical" : "horizontal"
    }-${Math.random()}`;

  const addDropPositions = (
    arr: any[],
    childCount: number,
    layerIndex: number,
    alignment: FlexLayerAlignment,
    isVertical: boolean,
    isNewLayer: boolean,
  ): any[] => {
    const res = [
      <DropPositionComponent
        alignment={alignment}
        childIndex={childCount}
        isNewLayer={isNewLayer}
        isVertical={isVertical}
        key={getDropPositionKey(0, alignment, layerIndex, true)}
        layerIndex={layerIndex}
        widgetId={props.widgetId}
      />,
    ];
    let count = 0;
    if (arr) {
      for (const item of arr) {
        const widgetId = item
          ? (item as JSX.Element)?.props.widgetId
          : undefined;
        // if (draggedWidget && widgetId && draggedWidget === widgetId) continue;
        count += 1;
        res.push(item);
        res.push(
          <DropPositionComponent
            alignment={alignment}
            childIndex={childCount + count}
            isNewLayer={isNewLayer}
            isVertical={isVertical}
            key={getDropPositionKey(0, alignment, layerIndex, true)}
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
      <NewLayerComponent
        alignment={FlexLayerAlignment.Start}
        childCount={childCount}
        isDragging={isCurrentCanvasDragging}
        isNewLayer
        isVertical={false}
        key={getDropPositionKey(
          Math.ceil(Math.random() * 100),
          FlexLayerAlignment.Start,
          0,
          false,
        )}
        layerIndex={0}
        map={map}
        widgetId={props.widgetId}
      />,
    ];
    props.flexLayers?.map((layer: FlexLayer, index: number) => {
      const { count, element } = processIndividualLayer(
        layer,
        childCount,
        index,
        map,
      );
      index === 1 &&
        props.widgetId !== "0" &&
        console.log("#### element", element);
      if (element === null) return null;
      childCount += count;
      layers.push(element);
      layers.push(
        <NewLayerComponent
          alignment={FlexLayerAlignment.Start}
          childCount={childCount}
          isDragging={isCurrentCanvasDragging}
          isNewLayer
          isVertical={false}
          key={getDropPositionKey(
            Math.ceil(Math.random() * 100),
            FlexLayerAlignment.Start,
            index,
            false,
          )}
          layerIndex={index}
          map={map}
          widgetId={props.widgetId}
        />,
      );
      return element;
    });
    return layers;
    // ?.filter((layer) => layer !== null);
  }

  function processIndividualLayer(
    layer: FlexLayer,
    childCount: number,
    index: number,
    map: { [key: string]: any },
    bypassEmptyCheck = false,
  ) {
    const { children, hasFillChild } = layer;
    props.widgetId !== "0" && console.log("#### children", children);
    let count = 0;
    let start = [],
      center = [],
      end = [];
    if ((!children || !children.length) && !bypassEmptyCheck)
      return { element: null, count };

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
    const startLength = start.length,
      centerLength = center.length;
    start = addDropPositions(
      start,
      childCount,
      index,
      FlexLayerAlignment.Start,
      true,
      false,
    );
    center = addDropPositions(
      center,
      childCount + startLength,
      index,
      FlexLayerAlignment.Center,
      true,
      false,
    );
    end = addDropPositions(
      end,
      childCount + startLength + centerLength,
      index,
      FlexLayerAlignment.End,
      true,
      false,
    );

    return {
      element: (
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
      ),
      count,
    };
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
