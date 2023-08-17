/* eslint-disable no-console */
import React, { useEffect, useState } from "react";
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
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import {
  getVerticalHighlightsForAlignedRow,
  getWidgetRowHeight,
} from "utils/autoLayout/layoutComponentHighlightUtils";
import {
  getLayoutComponent,
  renderChildWidget,
} from "utils/autoLayout/layoutComponentUtils";
import { getIsFillWidgetFromType } from "utils/autoLayout/flexLayerUtils";

const AlignedRow = (props: LayoutComponentProps) => {
  const {
    childrenMap,
    containerProps,
    isDropTarget,
    layout,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;

  const [hasFillWidget, setHasFillWidget] = useState<boolean>(false);

  useEffect(() => {
    if (rendersWidgets && childrenMap) {
      const layout: string[][] = props.layout as string[][];
      setHasFillWidget(
        layout.reduce((acc, curr) => {
          return (
            acc ||
            curr.some((id) => {
              return getIsFillWidgetFromType(childrenMap[id]?.type);
            })
          );
        }, false),
      );
    }
  }, [layout]);

  const renderChildren = () => {
    if (!childrenMap) return null;
    if (hasFillWidget) {
      return (
        [
          ...(layout[0] as string[]),
          ...(layout[1] as string[]),
          ...(layout[2] as string[]),
        ] as string[]
      ).map((id: string) =>
        renderChildWidget(childrenMap[id], layoutId, containerProps),
      );
    }
    return [
      <div className="alignment start-alignment" key={0}>
        {(layout[0] as string[]).map((id: string) =>
          renderChildWidget(childrenMap[id], layoutId, containerProps),
        )}
      </div>,
      <div className="alignment center-alignment" key={1}>
        {(layout[1] as string[]).map((id: string) =>
          renderChildWidget(childrenMap[id], layoutId, containerProps),
        )}
      </div>,
      <div className="alignment end-alignment" key={2}>
        {(layout[2] as string[]).map((id: string) =>
          renderChildWidget(childrenMap[id], layoutId, containerProps),
        )}
      </div>,
    ];
  };

  if (rendersWidgets && childrenMap) {
    return (
      <FlexLayout
        canvasId={props.containerProps?.widgetId || ""}
        flexDirection="row"
        flexWrap={layoutStyle?.flexWrap || "wrap"}
        isDropTarget={isDropTarget}
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
        {renderChildren()}
      </FlexLayout>
    );
  }
  return <div />;
};

AlignedRow.deriveHighlights = (data: {
  layoutProps: LayoutComponentProps;
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  canvasWidth?: number;
  parentLayout?: string;
  offsetTop?: number;
}): HighlightInfo[] => {
  return getVerticalHighlightsForAlignedRow(data);
};

AlignedRow.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: HighlightInfo,
): LayoutComponentProps => {
  const layout: string[][] = props.layout as string[][];
  const { alignment, rowIndex: index } = highlight;
  const map: { [key: string]: number } = {
    [FlexLayerAlignment.Start]: 0,
    [FlexLayerAlignment.Center]: 1,
    [FlexLayerAlignment.End]: 2,
  };
  const alignmentIndex = map[alignment];
  const alignmentRow: string[] = layout[alignmentIndex];
  const updatedAlignmentRow: string[] = [
    ...alignmentRow.slice(0, index),
    ...children,
    ...alignmentRow.slice(index),
  ] as string[];
  const updatedLayout = [...layout];
  updatedLayout[alignmentIndex] = updatedAlignmentRow as string[];
  return { ...props, layout: updatedLayout } as LayoutComponentProps;
};

AlignedRow.removeChild = (
  props: LayoutComponentProps,
  index: number,
): string[] | LayoutComponentProps[] => {
  const layout: any = props.layout;
  return [...layout.slice(0, index), ...layout.slice(index + 1)];
};

AlignedRow.getHeight = (
  layoutProps: LayoutComponentProps,
  widgetPositions: WidgetPositions,
): number => {
  const { layout, layoutId, layoutStyle, rendersWidgets } = layoutProps;
  // If layout positions are being tracked, return the current value.
  if (widgetPositions[layoutId]) return widgetPositions[layoutId].height;

  // Calculate height from styles
  const layoutHeight = layoutStyle
    ? Math.max(
        parseInt(layoutStyle?.height?.toString() || "0"),
        parseInt(layoutStyle?.minHeight?.toString() || "0"),
      )
    : 0;
  // If layout has no children, return the calculated css height.
  if (!layout.length) return layoutHeight;
  // Calculate height from children.
  if (rendersWidgets) {
    // Children are widgets
    const widgetHeight: number = getWidgetRowHeight(
      {
        ...layoutProps,
        layout: (layout as string[][]).reduce(
          (acc, curr) => [...acc, ...curr],
          [],
        ),
      },
      widgetPositions,
    ).totalHeight;
    return Math.max(widgetHeight, layoutHeight);
  } else {
    // renders layouts
    return (layout as LayoutComponentProps[]).reduce((acc, curr) => {
      // TODO: account for wrapping.
      const Comp = getLayoutComponent(curr.layoutType);
      if (!Comp) return acc;
      const height = Comp.getHeight(curr, widgetPositions);
      return Math.max(acc, height);
    }, 0);
  }
};

AlignedRow.getChildTemplate = (
  layoutProps: LayoutComponentProps,
): LayoutComponentProps | undefined => {
  const { childTemplate } = layoutProps;
  if (childTemplate) return childTemplate;
  return;
};

export default AlignedRow;
