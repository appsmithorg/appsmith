import { debounce, isArray } from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";

import {
  MOBILE_ROW_GAP,
  ResponsiveBehavior,
  ROW_GAP,
} from "utils/autoLayout/constants";
import AutoLayoutLayer from "./AutoLayoutLayer";
import { FLEXBOX_PADDING } from "constants/WidgetConstants";
import type {
  FlexLayer,
  FlexLayerLayoutData,
} from "utils/autoLayout/autoLayoutTypes";
import { getLayoutDataForFlexLayer } from "utils/autoLayout/flexLayerUtils";
import { useDispatch, useSelector } from "react-redux";
import { setCanvasMetaWidthAction } from "actions/autoLayoutActions";
import { getWidgets } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";

export interface FlexBoxProps {
  stretchHeight: boolean;
  useAutoLayout: boolean;
  children?: ReactNode;
  widgetId: string;
  flexLayers: FlexLayer[];
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
  row-gap: ${MOBILE_ROW_GAP}px;
  padding: ${FLEXBOX_PADDING}px;

  @media screen and (min-width: 481px) {
    row-gap: ${ROW_GAP}px;
  }
`;

export const DEFAULT_HIGHLIGHT_SIZE = 4;

function FlexBoxComponent(props: FlexBoxProps) {
  const currentWidth = useRef(0);
  const flexCanvasRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const debouncedDispatch = useCallback(
    debounce((computedWidth) => {
      dispatch(setCanvasMetaWidthAction(props.widgetId, computedWidth));
    }),
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

  const AutoLayoutLayerResizingHandles = ({ children, layer }: any) => {
    const allWidgets = useSelector(getWidgets);
    const widgetPositions = useSelector(
      (state: AppState) => state.entities.widgetPositions,
    );
    const isAutoCanvasResizing = useSelector(
      (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
    );
    const fillWidgetsOrderConfig = useMemo(() => {
      const fillWidgetsOrder: any = [];
      if (Object.keys(widgetPositions).length > 0 && !isAutoCanvasResizing) {
        (layer as FlexLayer).children.forEach((each, index) => {
          const { id } = each;
          const eachWidget = allWidgets[id];
          let leftWidget, rightWidget;
          if (
            eachWidget &&
            eachWidget.responsiveBehavior === ResponsiveBehavior.Fill
          ) {
            if (index > 0) {
              leftWidget = layer.children[index - 1];
            } else if (index < layer.children.length) {
              rightWidget = layer.children[index + 1];
            }
            fillWidgetsOrder.push({
              leftWidget,
              widget: eachWidget,
              position: widgetPositions[id],
              rightWidget,
            });
          }
        });
      }
      return fillWidgetsOrder;
    }, [allWidgets, widgetPositions, layer, isAutoCanvasResizing]);

    return (
      <>
        {fillWidgetsOrderConfig.map((each: any, index: any) => {
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: `${each.position.top}px`,
                left: `${each.position.left + each.position.width}px`,
                backgroundColor: "red",
                width: "3px",
                height: `${each.position.height}px`,
                zIndex: 4,
                cursor: "col-resize",
              }}
            />
          );
        })}
        {children}
      </>
    );
  };

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
      <AutoLayoutLayerResizingHandles layer={layer}>
        <AutoLayoutLayer
          centerChildren={centerChildren}
          endChildren={endChildren}
          hasFillWidget={hasFillWidget}
          index={index}
          key={index}
          startChildren={startChildren}
          widgetId={props.widgetId}
        />
      </AutoLayoutLayerResizingHandles>
    );
  }

  return (
    <FlexBoxContainer
      className={`flex-container-${props.widgetId}`}
      ref={flexCanvasRef}
    >
      {renderChildren()}
    </FlexBoxContainer>
  );
}

export default FlexBoxComponent;
