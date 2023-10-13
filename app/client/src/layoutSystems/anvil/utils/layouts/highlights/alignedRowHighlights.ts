import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type DraggedWidget,
  type LayoutComponent,
  type LayoutProps,
  type WidgetLayoutProps,
} from "../../anvilTypes";
import {
  AlignmentIndexMap,
  HIGHLIGHT_SIZE,
  HORIZONTAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  WidgetPosition,
  WidgetPositions,
} from "layoutSystems/common/types";
import { getStartPosition } from "./highlightUtils";
import {
  RowMetaInformation,
  checkIntersection,
  extractMetaInformation,
  generateHighlights,
  getHighlightsForWidgetsRow,
} from "./rowHighlights";

export function deriveAlignedRowHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  const { layout, layoutId, layoutType } = layoutProps;
  console.log("!!!!", { layout });
  /**
   * Step 1: Construct a base highlight.
   */
  const baseHighlight: AnvilHighlightInfo = {
    alignment: FlexLayerAlignment.Start,
    canvasId,
    dropZone: {},
    height: 0,
    isVertical: true,
    layoutOrder: [...layoutOrder, layoutId],
    posX: HIGHLIGHT_SIZE / 2,
    posY: HIGHLIGHT_SIZE / 2,
    rowIndex: 0,
    width: HIGHLIGHT_SIZE,
  };

  /**
   * Step 2: Check if layout is empty and appropriately return initial set of highlights.
   */
  if (!layout || !layout.length) {
    return getInitialHighlights(layoutProps, widgetPositions, baseHighlight);
  }

  /**
   * Step 3: Check if layout renders widgets.
   */
  const Comp: LayoutComponent = LayoutFactory.get(layoutType);
  const rendersWidgets: boolean = Comp.rendersWidgets(layoutProps);

  /**
   * Step 4: If layout renders layouts, derive highlights for widgets.
   */
  // AlignedRows are currently not expected to render layouts. This can be added later.
  if (!rendersWidgets) return [];

  /**
   * Step 5: Derive highlights for widgets.
   */
  return getHighlightsForWidgets(
    layoutProps,
    widgetPositions,
    draggedWidgets,
    baseHighlight,
  );
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[]
 * @returns AnvilHighlightInfo[] : List of highlights for empty AlignedRow.
 */
function getInitialHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  // TODO: Do we need to consider fill widget here?
  [
    FlexLayerAlignment.Start,
    FlexLayerAlignment.Center,
    FlexLayerAlignment.End,
  ].forEach((alignment: FlexLayerAlignment, index: number) => {
    const alignmentDimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-${index}`];
    const { height, left, top, width } = alignmentDimension;
    const posX: number = left + getStartPosition(alignment, width);
    highlights.push({
      ...baseHighlight,
      alignment,
      dropZone: {
        left: posX - left,
        right: left + width - posX,
      },
      height: height,
      posX: Math.max(posX - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
      posY: top,
    });
  });
  console.log("!!!!", { highlights });
  return highlights;
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param draggedWidgets | string[]
 * @param baseHighlight | AnvilHighlightInfo
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  draggedWidgets: DraggedWidget[],
  baseHighlight: AnvilHighlightInfo,
): AnvilHighlightInfo[] {
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  // If widgetPositions of alignment aren't tracked => this layout has a fill widget.
  const hasFillWidget: boolean = !widgetPositions.hasOwnProperty(
    `${layoutProps.layoutId}-0`,
  );

  if (hasFillWidget) {
    const highlights: AnvilHighlightInfo[] = getHighlightsForWidgetsRow(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
    );
    return highlights;
  }

  /**
   * Render highlights for AlignedRow with no fill widget.
   * 1. Check how alignments have been wrapped.
   */
  const layoutDimension: WidgetPosition = widgetPositions[layoutProps.layoutId];
  const startDimension: WidgetPosition =
    widgetPositions[
      `${layoutProps.layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Start]}`
    ];
  const isLayoutWrapped: boolean = [
    FlexLayerAlignment.Center,
    FlexLayerAlignment.End,
  ].reduce((acc: boolean, curr: FlexLayerAlignment) => {
    const dimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-${AlignmentIndexMap[curr]}`];
    return (
      acc ||
      !checkIntersection(
        [startDimension.top, startDimension.top + startDimension.height],
        [dimension.top, dimension.top + dimension.height],
      )
    );
  }, false);

  /**
   * If layout is not wrapped.
   */
  if (!isLayoutWrapped) {
    /**
     * If center alignment is empty and not in the middle anymore,
     * then don't insert highlights for it.
     */
    const map: { [key: string]: WidgetLayoutProps[] } = {
      [FlexLayerAlignment.Start]: [],
      [FlexLayerAlignment.Center]: [],
      [FlexLayerAlignment.End]: [],
    };
    layout.forEach((widget: WidgetLayoutProps) => {
      const { alignment } = widget;
      if (alignment === FlexLayerAlignment.Center)
        map[FlexLayerAlignment.Center].push(widget);
      else if (alignment === FlexLayerAlignment.End)
        map[FlexLayerAlignment.End].push(widget);
      else map[FlexLayerAlignment.Start].push(widget);
    });

    const startDimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-0`];
    const centerDimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-1`];
    const endDimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-2`];

    const avoidCenterAlignment: boolean =
      !map[FlexLayerAlignment.Center].length &&
      startDimension.width + endDimension.width > layoutDimension.width * 0.66;

    const highlights: AnvilHighlightInfo[] = [];

    const baseAlignmentLayout = (
      alignment: FlexLayerAlignment,
    ): LayoutProps => ({
      layoutId: `${layoutProps.layoutId}-${AlignmentIndexMap[alignment]}`,
      layoutType: LayoutComponentTypes.ROW,
      layout: map[alignment],
    });

    // Extract meta information about row.
    const startMeta: RowMetaInformation = extractMetaInformation(
      map[FlexLayerAlignment.Start],
      widgetPositions,
    );
    const centerMeta: RowMetaInformation = extractMetaInformation(
      map[FlexLayerAlignment.Center],
      widgetPositions,
    );
    const endMeta: RowMetaInformation = extractMetaInformation(
      map[FlexLayerAlignment.End],
      widgetPositions,
    );

    let childCount = 0;
    [startMeta, centerMeta, endMeta].forEach(
      (meta: RowMetaInformation, index: number) => {
        const { metaData, tallestWidgets } = meta;
        const layoutDimension: WidgetPosition =
          widgetPositions[`${layoutProps.layoutId}-${index}`];
        const alignment =
          index === 0
            ? FlexLayerAlignment.Start
            : index === 1
            ? FlexLayerAlignment.Center
            : FlexLayerAlignment.End;
        if (!metaData.length) {
          const startPos: number = getStartPosition(
            alignment,
            layoutDimension.width,
          );
          highlights.push({
            ...baseHighlight,
            alignment,
            dropZone: {
              left: startPos,
              right: layoutDimension.width - startPos,
            },
            height: layoutDimension.height,
            posX: layoutDimension.left + startPos,
            posY: layoutDimension.top,
            rowIndex: childCount,
          });
        } else {
          // Parse rows to add highlights.
        }
      },
    );

    return highlights;
  }
  return [];
}

/**
 * Default Preset:
 *
 * ALIGNED_COLUMN
 *  ALIGNED_ROW
 *   W1 W2
 *  ALIGNED_ROW <- AFFECTED LAYOUT
 *   W3 W5 <-
 *  ALIGNED_ROW <-
 *   W4 <-
 */

/**
 * MODAL Preset:
 *
 * COLUMN
 *  ROW (HEADER)
 *    TITLE_ROW
 *     W1
 *    ICON_ROW
 *     W2
 *  ALIGNED_COLUMN (MAIN)
 *    ALIGNED_ROW
 *      W3 W4
 *    ALIGNED_ROW <- AFFECTED LAYOUT (C)
 *      W5 W6 (C)
 *    ALIGNED_ROW (C)
 *      W7 W8 (C)
 *  ALIGNED_ROW (FOOTER) (C)
 *    W9 W10 (C)
 */
