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
import { FLEXBOX_PADDING } from "constants/WidgetConstants";

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

export const DEFAULT_HIGHLIGHT_SIZE = 4;

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

  gap: ${({ flexGap }) => `${flexGap}px`};

  padding: ${({ leaveSpaceForWidgetName }) =>
    leaveSpaceForWidgetName
      ? `${FLEXBOX_PADDING}px ${FLEXBOX_PADDING}px 22px ${FLEXBOX_PADDING}px;`
      : "0px;"};
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

  // const isDragging = useSelector(isCurrentCanvasDragging(props.widgetId));
  const isDragging: boolean = dragDetails?.draggedOn !== undefined;

  const renderChildren = () => {
    if (!props.children) return null;
    if (!props.useAutoLayout) return props.children;
    if (direction === LayoutDirection.Horizontal) {
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

  function processLayers(map: { [key: string]: any }) {
    const layers = [];
    let index = 0;
    for (const layer of props.flexLayers) {
      layers.push(processIndividualLayer(layer, map, index));
      index += 1;
    }
    return layers;
  }

  function getColumns(id: string, isMobile: boolean): number {
    const widget = allWidgets[id];
    if (!widget) return 0;
    return isMobile &&
      widget.mobileRightColumn !== undefined &&
      widget.mobileLeftColumn !== undefined
      ? widget.mobileRightColumn - widget.mobileLeftColumn
      : widget.rightColumn - widget.leftColumn;
  }

  function processIndividualLayer(
    layer: FlexLayer,
    map: { [key: string]: any },
    index: number,
  ) {
    const { children } = layer;

    const start = [],
      center = [],
      end = [];
    let startColumns = 0,
      centerColumns = 0,
      endColumns = 0;

    for (const child of children) {
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

    return (
      <AutoLayoutLayer
        center={center}
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
    );
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
