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
import { getWidgets } from "sagas/selectors";
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
  flexGap: number;
}

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
  hasFillChild?: boolean;
}

interface DropPositionProps {
  isVertical: boolean;
  alignment: FlexLayerAlignment;
  layerIndex: number;
  childIndex: number;
  widgetId: string;
  isNewLayer: boolean;
  rowIndex: number;
}

interface NewLayerProps {
  alignment: FlexLayerAlignment;
  childCount: number;
  layerIndex: number;
  isDragging: boolean;
  isNewLayer: boolean;
  isVertical: boolean;
  map: { [key: string]: any };
  widgetId: string;
}

export const FlexContainer = styled.div<{
  useAutoLayout?: boolean;
  direction?: LayoutDirection;
  stretchHeight: boolean;
  overflow: Overflow;
  leaveSpaceForWidgetName: boolean;
  isMobile?: boolean;
  isMainContainer: boolean;
  isDragging: boolean;
  flexGap: number;
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

  overflow: hidden;
  overflow-y: ${({ isMainContainer, isMobile }) =>
    isMainContainer || isMobile ? "auto" : "hidden"};

  padding: ${({ isDragging, leaveSpaceForWidgetName }) =>
    !isDragging && leaveSpaceForWidgetName ? "4px 4px 22px 4px;" : "4px;"};
  gap: ${({ flexGap }) => `${flexGap}px`};
`;

export const DEFAULT_HIGHLIGHT_SIZE = 4;

export const DropPosition = styled.div<{
  isDragging: boolean;
  isNewLayer: boolean;
  isVertical: boolean;
}>`
  width: ${({ isVertical }) =>
    isVertical ? `${DEFAULT_HIGHLIGHT_SIZE}px` : "calc(33% - 4px)"};
  height: ${({ isNewLayer, isVertical }) =>
    isVertical && !isNewLayer ? "auto" : `${DEFAULT_HIGHLIGHT_SIZE}px`};
  background-color: rgba(223, 158, 206, 0.6);
  margin: ${({ isVertical }) => (isVertical ? "2px 4px" : "2px")};
  display: ${({ isDragging }) => (isDragging ? "block" : "none")};
  align-self: stretch;
  opacity: 0;
`;

export const NewLayerStyled = styled.div<{
  isDragging: boolean;
}>`
  width: 100%;
  height: ${({ isDragging }) => (isDragging ? "6px" : "0px")};
`;

function FlexBoxComponent(props: FlexBoxProps) {
  // TODO: set isMobile as a prop at the top level
  const isMobile = useSelector(getIsMobile);
  const allWidgets = useSelector(getWidgets);
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;
  const appMode = useSelector(getAppMode);
  const leaveSpaceForWidgetName = appMode === APP_MODE.EDIT;
  // TODO: Add support for multiple dragged widgets
  const { dragDetails } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );
  const draggedOn: string | undefined = dragDetails
    ? dragDetails?.draggedOn
    : undefined;

  const draggedWidget = dragDetails
    ? dragDetails?.draggingGroupCenter?.widgetId
    : "";

  // const isDragging = useSelector(isCurrentCanvasDragging(props.widgetId));
  const isDragging: boolean = dragDetails?.draggedOn !== undefined;

  const renderChildren = () => {
    if (!props.children) return null;
    if (!props.useAutoLayout) return props.children;
    if (direction === LayoutDirection.Horizontal) {
      return addDropPositions({
        arr: props.children as any,
        childCount: 0,
        layerIndex: 0,
        alignment: FlexLayerAlignment.Start,
        isVertical: true,
        isNewLayer: true,
        addInitialHighlight: true,
      });
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

  function DropPositionComponent(props: DropPositionProps) {
    return (
      <DropPosition
        className={`t--drop-position-${props.widgetId} alignment-${
          props.alignment
        } layer-index-${props.layerIndex} child-index-${props.childIndex} ${
          props.isVertical ? "isVertical" : "isHorizontal"
        } ${props.isNewLayer ? "isNewLayer" : ""} row-index-${props.rowIndex}`}
        isDragging={draggedOn !== undefined}
        isNewLayer={props.isNewLayer}
        isVertical={props.isVertical}
      />
    );
  }

  function NewLayerComponent(props: NewLayerProps): JSX.Element {
    const { childCount, isDragging, layerIndex, map, widgetId } = props;

    const { element: verticalHighlights } = processIndividualLayer(
      { children: [], hasFillChild: false },
      childCount,
      layerIndex,
      map,
      true,
    );

    return (
      <NewLayerStyled
        id={`new-layer-${widgetId}-${layerIndex}`}
        isDragging={isDragging}
      >
        {verticalHighlights}
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

  const addDropPositions = (data: {
    arr: any[];
    childCount: number;
    layerIndex: number;
    alignment: FlexLayerAlignment;
    isVertical: boolean;
    isNewLayer: boolean;
    addInitialHighlight: boolean;
  }): any[] => {
    const {
      addInitialHighlight,
      alignment,
      arr,
      childCount,
      isNewLayer,
      isVertical,
      layerIndex,
    } = data;
    const res = addInitialHighlight
      ? [
          <DropPositionComponent
            alignment={alignment}
            childIndex={childCount}
            isNewLayer={isNewLayer}
            isVertical={isVertical}
            key={getDropPositionKey(0, alignment, layerIndex, true)}
            layerIndex={layerIndex}
            rowIndex={0}
            widgetId={props.widgetId}
          />,
        ]
      : [];
    let count = 0;
    if (arr) {
      for (const item of arr) {
        const widgetId = item
          ? (item as JSX.Element)?.props.widgetId
          : undefined;
        if (draggedWidget && widgetId && draggedWidget === widgetId) continue;
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
            rowIndex={count}
            widgetId={props.widgetId}
          />,
        );
      }
    }
    return res;
  };

  function getColumns(id: string, isMobile: boolean): number {
    const widget = allWidgets[id];
    if (!widget) return 0;
    return isMobile && widget.mobileRightColumn
      ? widget.mobileRightColumn
      : widget.rightColumn;
  }

  function processLayers(map: { [key: string]: any }) {
    const layers = [];
    let childCount = 0;
    let layerIndex = 0;
    for (const layer of props.flexLayers) {
      const isEmpty =
        layer?.children?.filter(
          (child: LayerChild) => child.id !== draggedWidget,
        ).length === 0;

      !isEmpty &&
        layers.push(
          <NewLayerComponent
            alignment={FlexLayerAlignment.Start}
            childCount={childCount}
            isDragging={isDragging}
            isNewLayer
            isVertical={false}
            key={getDropPositionKey(
              Math.ceil(Math.random() * 100),
              FlexLayerAlignment.Start,
              layerIndex,
              false,
            )}
            layerIndex={layerIndex}
            map={map}
            widgetId={props.widgetId}
          />,
        );

      const { count, element } = processIndividualLayer(
        layer,
        childCount,
        layerIndex,
        map,
      );
      childCount += count;
      if (!isEmpty) {
        layerIndex += 1;
        layers.push(element);
      }
    }
    layers.push(
      <NewLayerComponent
        alignment={FlexLayerAlignment.Start}
        childCount={childCount}
        isDragging={isDragging}
        isNewLayer
        isVertical={false}
        key={getDropPositionKey(
          Math.ceil(Math.random() * 100),
          FlexLayerAlignment.Start,
          layerIndex,
          false,
        )}
        layerIndex={layerIndex}
        map={map}
        widgetId={props.widgetId}
      />,
    );
    return layers;
  }

  function processIndividualLayer(
    layer: FlexLayer,
    childCount: number,
    index: number,
    map: { [key: string]: any },
    isNewLayer = false,
  ) {
    const { children } = layer;

    let count = 0;
    let start = [],
      center = [],
      end = [];
    let startColumns = 0,
      centerColumns = 0,
      endColumns = 0;

    for (const child of children) {
      count += 1;
      const widget = map[child.id];

      if (child.align === "end") {
        end.push(widget);
        endColumns += getColumns(child.id, isMobile);
      } else if (child.align === "center") {
        center.push(widget);
        centerColumns += getColumns(child.id, isMobile);
      } else {
        start.push(widget);
        startColumns += getColumns(child.id, isMobile);
      }
    }
    /**
     * Add drop positions
     */
    const startLength = start.length,
      centerLength = center.length;

    start = addDropPositions({
      arr: start,
      childCount,
      layerIndex: index,
      alignment: FlexLayerAlignment.Start,
      isVertical: !isNewLayer,
      isNewLayer,
      addInitialHighlight: !(
        start.length === 0 && centerColumns + endColumns > 60
      ),
    });
    center = addDropPositions({
      arr: center,
      childCount: childCount + startLength,
      layerIndex: index,
      alignment: FlexLayerAlignment.Center,
      isVertical: !isNewLayer,
      isNewLayer,
      addInitialHighlight: !(startColumns > 25 || endColumns > 25),
    });
    end = addDropPositions({
      arr: end,
      childCount: childCount + startLength + centerLength,
      layerIndex: index,
      alignment: FlexLayerAlignment.End,
      isVertical: !isNewLayer,
      isNewLayer,
      addInitialHighlight: !(centerColumns + startColumns > 60),
    });

    return {
      element: (
        <AutoLayoutLayer
          center={center}
          currentChildCount={childCount}
          direction={direction}
          end={end}
          flexGap={props.flexGap}
          hasFillChild={layer.hasFillChild}
          index={index}
          isCurrentCanvasDragging={isDragging}
          isMobile={isMobile}
          key={index}
          start={start}
          widgetId={props.widgetId}
          wrapCenter={centerColumns > 64}
          wrapEnd={endColumns > 64}
          wrapLayer={startColumns + centerColumns + endColumns > 64}
          wrapStart={startColumns > 64}
        />
      ),
      count,
    };
  }

  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      direction={direction}
      flexGap={props.flexGap}
      isDragging={isDragging}
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
