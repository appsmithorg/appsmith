import { isArray } from "lodash";
import type { CSSProperties, ReactNode } from "react";
import React, { useMemo } from "react";

import {
  FlexLayerAlignment,
  LayoutDirection,
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "layoutSystems/common/utils/constants";
import { APP_MODE } from "entities/App";
import { useSelector } from "react-redux";
import { getAppMode } from "ee/selectors/entitiesSelector";
import AutoLayoutLayer from "./AutoLayoutLayer";
import { FLEXBOX_PADDING, GridDefaults } from "constants/WidgetConstants";
import type {
  AlignmentColumnInfo,
  FlexBoxAlignmentColumnInfo,
} from "layoutSystems/autolayout/utils/types";
import { getColumnsForAllLayers } from "selectors/autoLayoutSelectors";
import { WidgetNameComponentHeight } from "layoutSystems/common/widgetName";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";

export interface FlexBoxProps {
  direction: LayoutDirection;
  stretchHeight: boolean;
  useAutoLayout: boolean;
  children?: ReactNode;
  widgetId: string;
  flexLayers: FlexLayer[];
  isMobile: boolean;
}

export const DEFAULT_HIGHLIGHT_SIZE = 4;

function FlexBoxComponent(props: FlexBoxProps) {
  const direction: LayoutDirection =
    props.direction || LayoutDirection.Horizontal;
  const appMode: APP_MODE | undefined = useSelector(getAppMode);
  const leaveSpaceForWidgetName = appMode === APP_MODE.EDIT;
  const isMobile: boolean = props.isMobile || false;
  const alignmentColumnInfo: FlexBoxAlignmentColumnInfo = useSelector(
    getColumnsForAllLayers(props.widgetId),
  );

  const renderChildren = () => {
    if (!props.children) return null;

    if (!props.useAutoLayout) return props.children;

    if (direction === LayoutDirection.Horizontal) {
      return props.children;
    }

    /**
     * Wrap children of a Vertical Stack in a flex layer.
     */
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: { [key: string]: any } = {};

    if (isArray(props.children)) {
      for (const child of props.children) {
        map[(child as JSX.Element).props?.widgetId] = child;
      }
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: any[] = processLayers(map);

    return layers;
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function processLayers(map: { [key: string]: any }) {
    const layers = [];

    for (const [index, layer] of props.flexLayers.entries()) {
      layers.push(processIndividualLayer(layer, map, index));
    }

    return layers;
  }

  function processIndividualLayer(
    layer: FlexLayer,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const columnInfo: AlignmentColumnInfo = alignmentColumnInfo[index];

    if (columnInfo) {
      startColumns = columnInfo[FlexLayerAlignment.Start];
      centerColumns = columnInfo[FlexLayerAlignment.Center];
      endColumns = columnInfo[FlexLayerAlignment.End];
    }

    for (const child of children) {
      const widget = map[child.id];

      if (child.align === FlexLayerAlignment.End) {
        end.push(widget);
      } else if (child.align === FlexLayerAlignment.Center) {
        center.push(widget);
      } else {
        start.push(widget);
      }
    }

    return (
      <AutoLayoutLayer
        center={center}
        centerColumns={centerColumns}
        direction={direction}
        end={end}
        endColumns={endColumns}
        index={index}
        isMobile={isMobile}
        key={index}
        start={start}
        startColumns={startColumns}
        widgetId={props.widgetId}
        wrapCenter={centerColumns > GridDefaults.DEFAULT_GRID_COLUMNS}
        wrapEnd={endColumns > GridDefaults.DEFAULT_GRID_COLUMNS}
        wrapLayer={
          startColumns + centerColumns + endColumns >
          GridDefaults.DEFAULT_GRID_COLUMNS
        }
        wrapStart={startColumns > GridDefaults.DEFAULT_GRID_COLUMNS}
      />
    );
  }

  const flexBoxStyle: CSSProperties = useMemo(() => {
    return {
      display: !!props.useAutoLayout ? "flex" : "block",
      flexDirection:
        props.direction === LayoutDirection.Vertical ? "column" : "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      flexWrap: "nowrap",
      width: "100%",
      height: props.stretchHeight ? "100%" : "auto",
      overflow: "hidden",
      padding: leaveSpaceForWidgetName
        ? `${FLEXBOX_PADDING}px ${FLEXBOX_PADDING}px ${WidgetNameComponentHeight}px ${FLEXBOX_PADDING}px`
        : "0px",
      rowGap: `${props.isMobile ? MOBILE_ROW_GAP : ROW_GAP}px`,
    };
  }, [
    props.useAutoLayout,
    props.direction,
    props.stretchHeight,
    props.isMobile,
    leaveSpaceForWidgetName,
  ]);

  return (
    <div className={`flex-container-${props.widgetId}`} style={flexBoxStyle}>
      {renderChildren()}
    </div>
  );
}

export default FlexBoxComponent;
