/* eslint-disable no-console */
import React from "react";
import AlignedRow from "components/designSystems/appsmith/autoLayout/layoutComponents/AlignedRow";
import Column from "components/designSystems/appsmith/autoLayout/layoutComponents/Column";
import Row from "components/designSystems/appsmith/autoLayout/layoutComponents/Row";
import type { HighlightInfo, LayoutComponentProps } from "./autoLayoutTypes";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import { FlexLayerAlignment, LayoutDirection } from "./constants";
import { generateReactKey } from "utils/generators";
import AlignedColumn from "components/designSystems/appsmith/autoLayout/layoutComponents/AlignedColumn";
import Fixed from "components/designSystems/appsmith/autoLayout/layoutComponents/Fixed";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import WidgetFactory from "utils/WidgetFactory";

export function getLayoutComponent(type: string): any {
  const map: { [id: string]: any } = {
    ALIGNED_COLUMN: AlignedColumn,
    ALIGNED_ROW: AlignedRow,
    COLUMN: Column,
    FIXED: Fixed,
    ROW: Row,
  };
  return map[type];
}

export function renderLayouts(
  layouts: LayoutComponentProps[],
  childrenMap: { [key: string]: WidgetProps } | undefined,
  containerProps: any,
) {
  return layouts.map((item: LayoutComponentProps, index: number) => {
    const Comp = getLayoutComponent(item.layoutType);
    return (
      <Comp
        childrenMap={getChildrenMap(item, childrenMap, {})}
        containerProps={containerProps}
        key={index}
        {...item}
      />
    );
  });
}

export function getChildrenMap(
  layoutProps: LayoutComponentProps,
  map?: { [id: string]: WidgetProps },
  res: { [id: string]: WidgetProps } = {},
): { [id: string]: WidgetProps } {
  if (!layoutProps || !map) return res;
  const { layout } = layoutProps;
  for (const each of layout) {
    if (typeof each === "string") {
      res[each] = map[each];
    } else if (Array.isArray(each)) {
      for (const id of each) {
        res[id] = map[id];
      }
    } else {
      getChildrenMap(each, map, res);
    }
  }
  return res;
}

export function renderChildWidget(
  childWidgetData: WidgetProps,
  layoutId: string,
  containerProps?: ContainerWidgetProps<WidgetProps> & {
    snapRows: number;
    snapSpaces: any;
  },
): React.ReactNode {
  if (!childWidgetData || !containerProps) return null;

  const childWidget = { ...childWidgetData };

  const snapSpaces = containerProps.snapSpaces;
  childWidget.parentColumnSpace = snapSpaces.snapColumnSpace;
  childWidget.parentRowSpace = snapSpaces.snapRowSpace;
  if (containerProps.noPad) childWidget.noContainerOffset = true;
  childWidget.parentId = containerProps.widgetId;
  // Pass layout controls to children
  childWidget.positioning =
    childWidget?.positioning || containerProps.positioning;
  childWidget.isFlexChild = containerProps.useAutoLayout;
  childWidget.direction = LayoutDirection.Vertical;
  childWidget.layoutId = layoutId;

  return WidgetFactory.createWidget(childWidget, containerProps.renderMode);
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
  isAligned?: boolean;
}): HighlightInfo[] {
  const { isAligned, layoutProps, parentLayout, widgetPositions, widgets } =
    data;
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
  // TODO: abstract this method into a simpler re-usable implementation.
  if (rendersWidgets) {
    const highlights: HighlightInfo[] = [];
    if (!layout?.length)
      return generateHorizontalHighlights({
        highlight: {
          ...base,
          index: 0,
          rowIndex: 0,
          posX: offsetLeft, // TODO: remove hard coding.
          posY: offsetTop,
          width: (layoutPositions.width || 0) - 4,
          height: 4,
          dropZone: {
            top: 10000,
            bottom: 10000,
          },
        },
        layoutWidth: (layoutPositions.width || 0) - 4,
        isAligned,
      });
    let index = 0;
    let lastChildHeight = -1;
    for (const id of layout as string[]) {
      const widget = widgets[id];
      if (!widget) continue;
      const { height, top } = widgetPositions[id];
      highlights.push(
        ...generateHorizontalHighlights({
          highlight: {
            ...base,
            index,
            rowIndex: index,
            posX: offsetLeft,
            posY: Math.max(top - layoutPositions.top, 2),
            width: (layoutPositions?.width || 0) - 4,
            height: 4,
            dropZone: {
              top: lastChildHeight === -1 ? 10000 : lastChildHeight / 2,
              bottom: height / 2,
            },
          },
          layoutWidth: (layoutPositions.width || 0) - 4,
          isAligned,
        }),
      );
      index += 1;
      lastChildHeight = height;
    }
    // Add a final highlight after the last widget.
    const { height, top } =
      widgetPositions[(layout as string[])[layout.length - 1]];
    highlights.push(
      ...generateHorizontalHighlights({
        highlight: {
          ...base,
          index: layout.length,
          rowIndex: layout.length,
          posX: offsetLeft,
          posY: top + height - layoutPositions.top,
          width: (layoutPositions?.width || 0) - 4,
          height: 4,
          dropZone: {
            top: height / 2,
            bottom: 10000,
          },
        },
        layoutWidth: (layoutPositions.width || 0) - 4,
        isAligned,
      }),
    );
    return highlights;
  } else {
    const highlights: HighlightInfo[] = [];
    let index = 0;
    const rowGap = 12;
    let posY = offsetTop;
    let lastChildHeight = -1;
    for (const each of layout as LayoutComponentProps[]) {
      if (each.isDropTarget) continue;
      const layoutComp = getLayoutComponent(each.layoutType);
      if (!layoutComp) continue;
      const arr = layoutComp.deriveHighlights({
        layoutProps: each,
        widgets,
        widgetPositions,
        offsetTop: posY,
        canvasWidth: layoutPositions.width,
        parentLayout,
      });
      const childHeight = layoutComp.getHeight(each, widgetPositions);
      highlights.push(
        ...generateHorizontalHighlights({
          highlight: {
            ...base,
            index: index,
            rowIndex: index,
            posX: offsetLeft,
            posY: posY,
            width: (layoutPositions?.width || 0) - 4,
            height: 4,
            dropZone: {
              top: lastChildHeight === -1 ? 10000 : lastChildHeight / 2,
              bottom: childHeight / 2,
            },
          },
          layoutWidth: (layoutPositions.width || 0) - 4,
          isAligned,
        }),
      );
      highlights.push(...arr);
      posY += rowGap + childHeight;
      index += 1;
      lastChildHeight = childHeight;
    }
    highlights.push(
      ...generateHorizontalHighlights({
        highlight: {
          ...base,
          index: index,
          rowIndex: index,
          posX: offsetLeft,
          posY: Math.min(
            posY,
            offsetTop + layoutPositions.height - 4 - padding,
          ),
          width: (layoutPositions?.width || 0) - 4,
          height: 4,
          dropZone: {
            top: lastChildHeight === -1 ? 10000 : lastChildHeight / 2,
            bottom: 10000,
          },
        },
        layoutWidth: (layoutPositions.width || 0) - 4,
        isAligned,
      }),
    );
    return highlights;
  }
}

function generateHorizontalHighlights(data: {
  highlight: HighlightInfo;
  layoutWidth: number;
  isAligned?: boolean;
}): HighlightInfo[] {
  const { highlight, isAligned, layoutWidth } = data;
  if (!isAligned) return [highlight];
  const width = (layoutWidth - 4) / 3;
  return [
    { ...highlight, alignment: FlexLayerAlignment.Start, width },
    {
      ...highlight,
      alignment: FlexLayerAlignment.Center,
      posX: highlight.posX + width,
      width,
    },
    {
      ...highlight,
      alignment: FlexLayerAlignment.End,
      posX: highlight.posX + 2 * width,
      width,
    },
  ];
}

export function addWidgetToTemplate(
  template: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  alignment: FlexLayerAlignment = FlexLayerAlignment.Start,
): LayoutComponentProps {
  let obj: LayoutComponentProps = {
    ...template,
    layoutId: generateReactKey(),
  };
  if (template.insertChild) {
    if (!obj.layout.length)
      obj = {
        ...obj,
        layout: [...obj.layout, ...children],
      } as LayoutComponentProps;
    else {
      const index = getAlignmentIndex(alignment);
      const layout = [...(obj.layout as string[][])];
      layout[index] = [...layout[index], ...(children as string[])];
      obj = {
        ...obj,
        layout,
      } as LayoutComponentProps;
    }
  } else if (template.layout?.length) {
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

// function isAlignedRowEmpty(layout: string[][]): boolean {
//   for (const each of layout) {
//     if (each.length) return false;
//   }
//   return true;
// }

// function removeDeletableLayouts(
//   layout: LayoutComponentProps[],
// ): LayoutComponentProps[] {
//   return layout.filter((each) => {
//     if (
//       each.canBeDeleted &&
//       (!each.layout.length || !isAlignedRowEmpty(each.layout as string[][]))
//     )
//       return false;
//     if (each.layout?.length && containsLayout(each.layout)) {
//       each.layout = removeDeletableLayouts(
//         each.layout as LayoutComponentProps[],
//       );
//       return (each.layout as LayoutComponentProps[]).length;
//     }
//     return true;
//   });
// }

// function containsLayout(layout: any[]): boolean {
//   for (const each of layout) {
//     if (typeof each[0] === "string" || Array.isArray(each[0])) return false;
//   }
//   return true;
// }

export function getAlignmentIndex(alignment: FlexLayerAlignment): number {
  const map: { [key: string]: number } = {
    [FlexLayerAlignment.Start]: 0,
    [FlexLayerAlignment.Center]: 1,
    [FlexLayerAlignment.End]: 2,
  };
  return map[alignment];
}
