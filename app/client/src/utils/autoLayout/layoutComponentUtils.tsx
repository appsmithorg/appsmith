/* eslint-disable no-console */
import React from "react";
import AlignedRow from "components/designSystems/appsmith/autoLayout/layoutComponents/AlignedRow";
import Column from "components/designSystems/appsmith/autoLayout/layoutComponents/Column";
import Row from "components/designSystems/appsmith/autoLayout/layoutComponents/Row";
import type { HighlightInfo, LayoutComponentProps } from "./autoLayoutTypes";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import { FlexLayerAlignment } from "./constants";
import { generateReactKey } from "utils/generators";

export function getLayoutComponent(type: string): any {
  const map: { [id: string]: any } = {
    ALIGNED_ROW: AlignedRow,
    COLUMN: Column,
    ROW: Row,
  };
  return map[type];
}

export function renderLayouts(
  layouts: LayoutComponentProps[],
  childrenMap: { [key: string]: any } | undefined,
  containerProps: any,
) {
  return layouts.map((item: LayoutComponentProps, index: number) => {
    const Comp = getLayoutComponent(item.layoutType);
    return (
      <Comp
        childrenMap={childrenMap}
        containerProps={containerProps}
        key={index}
        {...item}
      />
    );
  });
}

export function getLayoutFromId(
  layout: LayoutComponentProps[],
  id: string,
): LayoutComponentProps | null {
  if (!layout || !layout.length || !id) return null;
  for (const each of layout) {
    if (each.layoutId === id) return each;
    if (each.layout && each.layout.length) {
      const layout = getLayoutFromId(each.layout as LayoutComponentProps[], id);
      if (layout) return layout;
    }
  }
  return null;
}

// export function getLayoutDataType(layout: string | string[])

export function updateLayoutById(
  parentLayout: LayoutComponentProps,
  updatedLayout: LayoutComponentProps,
): LayoutComponentProps {
  let currentLayout: LayoutComponentProps = { ...parentLayout };
  if (currentLayout.layoutId === updatedLayout.layoutId) return updatedLayout;
  if (currentLayout.rendersWidgets) return parentLayout;
  let index = 0;
  const layout = [...(currentLayout.layout as LayoutComponentProps[])];
  for (const each of layout) {
    layout[index] = updateLayoutById(
      each as LayoutComponentProps,
      updatedLayout,
    );
    index += 1;
  }
  currentLayout = { ...currentLayout, layout };
  return currentLayout;
}

export function updateVerticalDropZoneAndHeight(
  highlights: HighlightInfo[],
  layoutWidth: number,
): HighlightInfo[] {
  const zoneSize = 0.35;
  for (const [index, each] of highlights.entries()) {
    const previousHighlight: HighlightInfo | undefined = highlights[index - 1];
    const nextHighlight: HighlightInfo | undefined = highlights[index + 1];
    const left: number = Math.max(
      previousHighlight
        ? (each.posX -
            (each.posY < previousHighlight.posY + previousHighlight.height
              ? previousHighlight.posX
              : 0)) *
            zoneSize
        : each.posX + DEFAULT_HIGHLIGHT_SIZE,
      DEFAULT_HIGHLIGHT_SIZE,
    );
    const right: number = Math.max(
      nextHighlight
        ? ((each.posY + each.height > nextHighlight.posY
            ? nextHighlight.posX
            : layoutWidth) -
            each.posX) *
            zoneSize
        : layoutWidth - each.posX,
      DEFAULT_HIGHLIGHT_SIZE,
    );
    highlights[index] = {
      ...each,
      dropZone: {
        left,
        right,
      },
    };
  }
  return highlights;
}

export function generateHighlightsForColumn(data: {
  layoutProps: LayoutComponentProps;
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  parentLayout?: string;
}): HighlightInfo[] {
  const { layoutProps, parentLayout, widgetPositions, widgets } = data;
  const { isDropTarget, layout, layoutId, layoutStyle, rendersWidgets } =
    layoutProps;
  const base = {
    alignment: FlexLayerAlignment.Start,
    isNewLayer: true,
    isVertical: false,
    layerIndex: 0,
    canvasId: layoutProps.containerProps?.widgetId || "0",
    dropZone: {},
    layoutId,
  };
  const layoutPositions = widgetPositions[layoutId];
  if (!layoutPositions) return [];
  const padding = parseInt(layoutStyle?.padding?.toString() || "0");
  const offsetTop = isDropTarget ? padding : layoutPositions.top; // TODO: Account for padding here.
  const offsetLeft = 2;
  if (rendersWidgets) {
    const highlights: HighlightInfo[] = [];
    if (!layout?.length)
      return [
        {
          ...base,
          index: 0,
          rowIndex: 0,
          posX: 2, // TODO: remove hard coding.
          posY: offsetTop,
          width: (layoutPositions.width || 0) - 4,
          height: 4,
        },
      ];
    let index = 0;
    for (const id of layout as string[]) {
      const widget = widgets[id];
      if (!widget) continue;
      const { top } = widgetPositions[id];
      highlights.push({
        ...base,
        index,
        rowIndex: index,
        posX: offsetLeft,
        posY: Math.max(top - layoutPositions.top, 2),
        width: (layoutPositions?.width || 0) - 4,
        height: 4,
      });
      index += 1;
    }
    // Add a final highlight after the last widget.
    const { height, top } =
      widgetPositions[(layout as string[])[layout.length - 1]];
    highlights.push({
      ...base,
      index: layout.length,
      rowIndex: layout.length,
      posX: offsetLeft,
      posY: top + height - layoutPositions.top,
      width: (layoutPositions?.width || 0) - 4,
      height: 4,
    });
    return updateHorizontalDropZone(highlights);
  } else {
    const highlights: HighlightInfo[] = [];
    let index = 0;
    const rowGap = 12;
    let posY = offsetTop;
    for (const each of layout as LayoutComponentProps[]) {
      if (each.isDropTarget) continue;
      const layoutComp = getLayoutComponent(each.layoutType);
      if (!layoutComp) continue;
      highlights.push({
        ...base,
        index: index,
        rowIndex: index,
        posX: offsetLeft,
        posY: posY,
        width: (layoutPositions?.width || 0) - 4,
        height: 4,
      });
      const arr = layoutComp.deriveHighlights({
        layoutProps: each,
        widgets,
        widgetPositions,
        offsetTop: posY,
        canvasWidth: layoutPositions.width,
        parentLayout,
      });
      posY += rowGap + layoutComp.getHeight(each, widgetPositions);
      highlights.push(...arr);
      index += 1;
    }
    highlights.push({
      ...base,
      index: index,
      rowIndex: index,
      posX: offsetLeft,
      posY: Math.min(posY, offsetTop + layoutPositions.height - 4 - padding),
      width: (layoutPositions?.width || 0) - 4,
      height: 4,
    });
    return updateHorizontalDropZone(highlights);
  }
}

// TODO: handle case of aligned horizontal highlights.
export function updateHorizontalDropZone(
  highlights: HighlightInfo[],
): HighlightInfo[] {
  const arr: { index: number; highlight: HighlightInfo }[] = [];
  highlights.forEach((each: HighlightInfo, index: number) => {
    if (!each.isVertical) {
      arr.push({ index, highlight: each });
    }
  });
  arr.forEach((each, index: number) => {
    const curr: HighlightInfo = each.highlight;
    const prev: HighlightInfo | undefined = arr[index - 1]?.highlight;
    const next: HighlightInfo | undefined = arr[index + 1]?.highlight;
    const dropZone = {
      top: prev ? (curr.posY - prev.posY) / 2 : curr.posY,
      bottom: next ? (next.posY - curr.posY) / 2 : 10000,
    };
    highlights[each.index] = {
      ...highlights[each.index],
      dropZone,
    };
  });
  return highlights;
}

export function addWidgetToTemplate(
  template: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
): LayoutComponentProps {
  const obj: LayoutComponentProps = {
    ...template,
    layout: [],
    layoutId: generateReactKey(),
  };
  if (template.insertChild) obj.layout = children;
  else if (template.layout?.length) {
    obj.layout = (template.layout as LayoutComponentProps[]).map((each) =>
      addWidgetToTemplate(each, children),
    );
  }
  return obj;
}

export function updateLayoutAfterWidgetDeletion(
  template: LayoutComponentProps,
  child: string,
): LayoutComponentProps {
  const obj: LayoutComponentProps = {
    ...template,
    layout: [],
  };
  if (template.layout.length) {
    if (template.rendersWidgets) {
      obj.layout = (template.layout as string[]).filter(
        (each) => each !== child,
      );
    } else
      obj.layout = (template.layout as LayoutComponentProps[]).map((each) =>
        updateLayoutAfterWidgetDeletion(each, child),
      );
  }
  obj.layout = (obj.layout as LayoutComponentProps[]).filter(
    (each: LayoutComponentProps) => !(each.canBeDeleted && !each.layout.length),
  );
  return obj;
}

export function deleteWidgetFromLayout(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
): CanvasWidgetsReduxState {
  const parent = widgets[parentId];
  if (!parent) return widgets;
  const layout: LayoutComponentProps[] = parent.layout || [];
  if (!layout?.length) return widgets;

  const newLayout: LayoutComponentProps[] = layout.map(
    (each: LayoutComponentProps) =>
      updateLayoutAfterWidgetDeletion(each, widgetId),
  );

  return {
    ...widgets,
    [parentId]: {
      ...parent,
      layout: newLayout.filter(
        (each: LayoutComponentProps) =>
          !(each.canBeDeleted && !each.layout.length),
      ),
    },
  };
}
