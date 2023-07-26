/* eslint-disable no-console */
import React from "react";
import type {
  HighlightInfo,
  LayoutComponentProps,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import "../styles.css";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import {
  FlexLayerAlignment,
  LayoutDirection,
} from "utils/autoLayout/constants";
import { updateVerticalDropZoneAndHeight } from "utils/autoLayout/layoutComponentUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";

const AlignedRow = (props: LayoutComponentProps) => {
  const {
    childrenMap,
    isDropTarget,
    layout,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;
  if (rendersWidgets && childrenMap) {
    return (
      <FlexLayout
        flexDirection="row"
        layoutId={layoutId}
        {...(layoutStyle || {})}
      >
        {isDropTarget && props.containerProps ? (
          <CanvasDraggingArena
            {...props.containerProps.snapSpaces}
            alignItems={props.containerProps.alignItems}
            canExtend={props.containerProps.canExtend}
            direction={
              layoutType.includes("ROW")
                ? LayoutDirection.Horizontal
                : LayoutDirection.Vertical
            }
            dropDisabled={!!props.containerProps.dropDisabled}
            layoutId={layoutId}
            noPad={props.containerProps.noPad}
            parentId={props.containerProps.parentId}
            snapRows={props.containerProps.snapRows}
            useAutoLayout={props.containerProps.useAutoLayout}
            widgetId={props.containerProps.widgetId}
            widgetName={props.containerProps.widgetName}
          />
        ) : null}
        <div className="alignment start-alignment">
          {(layout[0] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment center-alignment">
          {(layout[1] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment end-alignment">
          {(layout[2] as string[]).map((id: string) => childrenMap[id])}
        </div>
      </FlexLayout>
    );
  }
  return <div />;
};

AlignedRow.getHeight = (
  props: LayoutComponentProps,
  widgets: CanvasWidgetsReduxState,
  widgetPositions: WidgetPositions,
) => {
  if (props.rendersWidgets) {
    const layout: string[][] = props.layout as string[][];
    let maxHeight = 0;
    for (const each of layout) {
      const rowHeight = each.reduce((acc, id) => {
        const widget = widgets[id];
        if (!widget) return acc;
        const { height } = widgetPositions[id];
        return Math.max(acc, height);
      }, 0);
      maxHeight += rowHeight;
    }
    return maxHeight;
  }
  // TODO: Handle nested layouts.
};

AlignedRow.getWidth = (props: LayoutComponentProps): number => {
  const { layoutId } = props;
  const el = document.getElementById("layout-" + layoutId);
  const rect: DOMRect | undefined = el?.getBoundingClientRect();
  if (!rect) return 0;
  return rect.width;
};

AlignedRow.deriveHighlights = (
  props: LayoutComponentProps,
  widgets: CanvasWidgetsReduxState,
  widgetPositions: WidgetPositions,
  width: number,
): HighlightInfo[] => {
  const { layout, layoutId, rendersWidgets } = props;
  if (rendersWidgets) {
    const highlights: HighlightInfo[] = [];
    if (!layout?.length) return [];
    let maxHeight = 0;
    for (const [index, id] of (layout as string[]).entries()) {
      const widget = widgets[id];
      if (!widget) continue;
      const { height, left, top } = widgetPositions[id];
      maxHeight = Math.max(maxHeight, height);
      highlights.push({
        alignment: FlexLayerAlignment.Start,
        isNewLayer: false,
        index,
        layerIndex: 0,
        rowIndex: index,
        posX: Math.min(left, 2),
        posY: top,
        width: 4,
        height: height,
        isVertical: true,
        canvasId: props.containerProps?.widgetId || "0",
        dropZone: {},
        layoutId,
      });
    }
    return updateVerticalDropZoneAndHeight(highlights, maxHeight, width);
  }
  // TODO: Handle nested layouts.
  return [];
};

AlignedRow.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  index: number,
): string[] | LayoutComponentProps[] => {
  const layout: any = props.layout;
  return [...layout.slice(0, index), ...children, ...layout.slice(index)];
};

AlignedRow.removeChild = (
  props: LayoutComponentProps,
  index: number,
): string[] | LayoutComponentProps[] => {
  const layout: any = props.layout;
  return [...layout.slice(0, index), ...layout.slice(index + 1)];
};

export default AlignedRow;
