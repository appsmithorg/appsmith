import { debounce, isArray } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import React, { useMemo } from "react";
import styled from "styled-components";

import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";
import AutoLayoutLayer from "./AutoLayoutLayer";
import { FLEXBOX_PADDING } from "constants/WidgetConstants";
import type {
  FlexLayer,
  FlexLayerLayoutData,
} from "utils/autoLayout/autoLayoutTypes";
import { getLayoutDataForFlexLayer } from "utils/autoLayout/flexLayerUtils";
import { useDispatch } from "react-redux";
import { setCanvasMetaWidthAction } from "actions/autoLayoutActions";

export interface FlexBoxProps {
  stretchHeight: boolean;
  useAutoLayout: boolean;
  children?: ReactNode;
  widgetId: string;
  flexLayers: FlexLayer[];
  isMobile: boolean;
}

export const FlexBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: nowrap;
  width: 100%;
  height: auto;
  overflow: hidden;
`;

export const DEFAULT_HIGHLIGHT_SIZE = 4;

function FlexBoxComponent(props: FlexBoxProps) {
  const isMobile: boolean = props.isMobile || false;
  const currentWidth = useRef(0);
  const flexCanvasRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const debouncedDispatch = useCallback(
    debounce((computedWidth) => {
      dispatch(setCanvasMetaWidthAction(props.widgetId, computedWidth));
    }, 50),
    [props.widgetId],
  );
  const resizeObserver = useRef(
    new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const computedWidth = entry.contentRect.width;
        if (computedWidth !== currentWidth.current) {
          debouncedDispatch(computedWidth);
          currentWidth.current = computedWidth;
        }
      });
    }),
  );

  useEffect(() => {
    if (flexCanvasRef && flexCanvasRef.current) {
      resizeObserver.current.observe(flexCanvasRef.current);
    }
    return () => {
      if (flexCanvasRef && flexCanvasRef.current) {
        resizeObserver.current.unobserve(flexCanvasRef.current);
      }
    };
  }, []);

  const renderChildren = () => {
    if (!props.children) return null;
    if (!props.useAutoLayout) return props.children;

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

  function processLayers(map: { [key: string]: any }) {
    const layers = [];
    for (const [index, layer] of props.flexLayers.entries()) {
      layers.push(processIndividualLayer(layer, map, index));
    }
    return layers;
  }

  function processIndividualLayer(
    layer: FlexLayer,
    map: { [key: string]: any },
    index: number,
  ) {
    const {
      centerChildren,
      endChildren,
      hasFillWidget,
      startChildren,
    }: FlexLayerLayoutData = getLayoutDataForFlexLayer(map, layer);

    return (
      <AutoLayoutLayer
        centerChildren={centerChildren}
        endChildren={endChildren}
        hasFillWidget={hasFillWidget}
        index={index}
        isMobile={isMobile}
        key={index}
        startChildren={startChildren}
        widgetId={props.widgetId}
      />
    );
  }

  const flexBoxStyle: CSSProperties = useMemo(() => {
    return {
      padding: `${FLEXBOX_PADDING}px`,
      rowGap: `${props.isMobile ? MOBILE_ROW_GAP : ROW_GAP}px`,
    };
  }, [props.isMobile]);

  return (
    <FlexBoxContainer
      className={`flex-container-${props.widgetId}`}
      ref={flexCanvasRef}
      style={flexBoxStyle}
    >
      {renderChildren()}
    </FlexBoxContainer>
  );
}

export default FlexBoxComponent;
