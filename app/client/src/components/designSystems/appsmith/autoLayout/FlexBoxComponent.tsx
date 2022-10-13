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
  overflow-y: ${({ isMobile }) => (isMobile ? "auto" : "hidden")};
  padding: 4px;
`;

function FlexBoxComponent(props: FlexBoxProps) {
  // TODO: set isMobile as a prop at the top level
  const isMobile = useIsMobileDevice();
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;

  // const layoutProps = useMemo(
  //   () => getLayoutProperties(props.direction, props.alignment, props.spacing),
  //   [props.direction, props.alignment, props.spacing],
  // );
  const { autoLayoutDragDetails, dragDetails, flexHighlight } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

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
    if (
      !props.useAutoLayout ||
      direction === LayoutDirection.Horizontal ||
      !(props.flexLayers && props.flexLayers.length)
    ) {
      if (flexHighlight && dragDetails.draggedOn === props.widgetId) {
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
        const allChildren = [
          ...filteredChildren.slice(0, flexHighlight?.index),
          previewNode,
          ...filteredChildren.slice(flexHighlight?.index),
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
    let childCount = 0,
      index = 0;
    let highLightAdded = false;
    const layers: any[] = [];
    // TODO: Add highlight index within a layer to the data model to simplify this logic.
    for (const layer of props.flexLayers) {
      const { children, hasFillChild } = layer;
      let start = [],
        center = [],
        end = [];
      if (!children || !children.length) {
        const previewNode = getPreviewNode();
        start.push(previewNode);
      }

      for (const child of children) {
        if (
          flexHighlight &&
          !highLightAdded &&
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
          highLightAdded = true;

          if (flexHighlight.isNewLayer) {
            layers.push(
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
              />,
            );
            index += 1;
            start = [];
            center = [];
            end = [];
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
        if (
          flexHighlight &&
          !highLightAdded &&
          !flexHighlight.isNewLayer &&
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
          highLightAdded = true;
        }
      }
      layers.push(
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
        />,
      );
      index += 1;
    }
    return layers;
  };

  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      direction={direction}
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
