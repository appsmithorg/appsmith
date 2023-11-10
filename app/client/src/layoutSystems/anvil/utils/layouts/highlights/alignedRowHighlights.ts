import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  GetDimensions,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import {
  HIGHLIGHT_SIZE,
  HORIZONTAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";
import { getNonDraggedWidgets, getStartPosition } from "./highlightUtils";
import {
  type RowMetaData,
  type RowMetaInformation,
  extractMetaInformation,
  getHighlightsForWidgetsRow,
} from "./rowHighlights";
import { getAlignmentLayoutId } from "../layoutUtils";
import { getRelativeDimensions } from "./dimensionUtils";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";

export const deriveAlignedRowHighlights =
  (layoutProps: LayoutProps, canvasId: string, layoutOrder: string[]) =>
  (
    positions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ): AnvilHighlightInfo[] => {
    if (!draggedWidgets.length || !positions[layoutProps.layoutId]) return [];
    const { layout } = layoutProps;

    const getDimensions: (id: string) => LayoutElementPosition =
      getRelativeDimensions(positions);

    /**
     * Step 1: Construct a base highlight.
     */
    const baseHighlight: AnvilHighlightInfo = {
      alignment: FlexLayerAlignment.Start,
      canvasId,
      dropZone: {},
      height: 0,
      isVertical: true,
      layoutOrder,
      posX: HIGHLIGHT_SIZE / 2,
      posY: HIGHLIGHT_SIZE / 2,
      rowIndex: 0,
      width: HIGHLIGHT_SIZE,
    };

    /**
     * Step 2: Check if layout is empty and appropriately return initial set of highlights.
     */
    if (!layout || !layout.length) {
      return getInitialHighlights(
        layoutProps,
        baseHighlight,
        draggedWidgets,
        getDimensions,
      );
    }

    /**
     * Step 3: Derive highlights for widgets.
     */
    return getHighlightsForWidgets(
      layoutProps,
      positions,
      draggedWidgets,
      baseHighlight,
      getDimensions,
    );
  };

/**
 *
 * @param layoutProps | LayoutProps
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[]
 * @param getDimensions | GetDimensions : method to get relative position of entity.
 * @returns AnvilHighlightInfo[] : List of highlights for empty AlignedRow.
 */
function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
): AnvilHighlightInfo[] {
  let highlights: AnvilHighlightInfo[] = [];

  // Check if dragged widgets contain a Fill widget.
  const hasFillWidget: boolean = draggedWidgets.some(
    (widget: DraggedWidget) =>
      widget.responsiveBehavior === ResponsiveBehavior.Fill,
  );

  /**
   * If dragged widgets contain a fill widget,
   * then draw a single highlight that spans the width of the layout.
   * else draw three highlights, one for each alignment.
   */
  const arr = hasFillWidget
    ? [FlexLayerAlignment.Start]
    : [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ];

  arr.forEach((alignment: FlexLayerAlignment, index: number) => {
    const alignmentDimension: LayoutElementPosition = getDimensions(
      `${layoutProps.layoutId}-${index}`,
    );
    highlights = updateHighlights(
      highlights,
      baseHighlight,
      index,
      alignment,
      alignmentDimension,
      undefined,
      undefined,
      true,
      !!layoutProps.isDropTarget,
    );
  });

  return highlights;
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param positions | WidgetPositions
 * @param draggedWidgets | string[]
 * @param baseHighlight | AnvilHighlightInfo
 * @param getDimensions | GetDimensions
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  positions: LayoutElementPositions,
  draggedWidgets: DraggedWidget[],
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
): AnvilHighlightInfo[] {
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];
  const layoutDimension: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  // If positions of alignment aren't tracked => this layout has a fill widget.
  const hasFillWidget: boolean = !positions.hasOwnProperty(
    `${layoutProps.layoutId}-0`,
  );

  /**
   * If AlignedRow has a fill widget,
   * then it renders all widgets directly without using alignments.
   */
  if (hasFillWidget) {
    const highlights: AnvilHighlightInfo[] = getHighlightsForWidgetsRow(
      layoutProps,
      baseHighlight,
      draggedWidgets,
      getDimensions,
    );
    return highlights;
  }

  /**
   * Check if layout has widgets that are not being dragged.
   */
  const nonDraggedWidgets: WidgetLayoutProps[] = getNonDraggedWidgets(
    layout,
    draggedWidgets,
  );

  if (!nonDraggedWidgets.length && !layoutProps.isDropTarget) return [];

  /**
   * Collect all information on alignments
   */
  const alignmentInfo: AlignmentInfo = extractAlignmentInfo(
    layoutProps.layoutId,
    layout,
    getDimensions,
  );

  let highlights: AnvilHighlightInfo[] = [];
  let childCount = 0;
  Object.keys(alignmentInfo).forEach((alignment: string) => {
    const { dimension, meta, widgets } = alignmentInfo[alignment];

    /**
     * If the alignment doesn't render any widgets, then derive initial highlights for the alignment.
     */
    if (!widgets.length) {
      /**
       * If it is an empty Center alignment,
       * which is no longer in the center position due to the size of its siblings,
       * then don't add any highlights for it.
       */
      if (
        alignment === FlexLayerAlignment.Center &&
        alignmentInfo[FlexLayerAlignment.Start].dimension.width +
          alignmentInfo[FlexLayerAlignment.Start].dimension.width >
          (layoutDimension.width * 2) / 3
      )
        return;

      highlights = updateHighlights(
        highlights,
        baseHighlight,
        childCount,
        alignment as FlexLayerAlignment,
        dimension,
        undefined,
        undefined,
        true,
        !!layoutProps.isDropTarget,
      );
    } else {
      const { metaData, tallestWidgets } = meta;
      let rIndex = 0;
      while (rIndex < metaData.length) {
        const row: RowMetaData[] = metaData[rIndex];
        const tallestWidget = tallestWidgets[rIndex];

        let temp: AnvilHighlightInfo[] = [];
        row.forEach((each: RowMetaData, index: number) => {
          const isDraggedWidget: boolean = draggedWidgets.some(
            (widget: DraggedWidget) => widget.widgetId === each.widgetId,
          );
          const currentDimension: LayoutElementPosition = getDimensions(
            each.widgetId,
          );
          const tallestDimension: LayoutElementPosition = getDimensions(
            tallestWidget.widgetId,
          );

          /**
           * Add a highlight before the widget
           */
          if (!isDraggedWidget) {
            temp = updateHighlights(
              temp,
              baseHighlight,
              childCount,
              alignment as FlexLayerAlignment,
              dimension,
              currentDimension,
              tallestDimension,
              false,
              !!layoutProps.isDropTarget,
            );
            childCount += 1;
          }

          if (index === row.length - 1) {
            /**
             * Add a highlight after the last widget in the row.
             */
            temp = updateHighlights(
              temp,
              baseHighlight,
              childCount,
              alignment as FlexLayerAlignment,
              dimension,
              currentDimension,
              tallestDimension,
              true,
              !!layoutProps.isDropTarget,
            );
            highlights.push(...temp);
            temp = [];
          }
        });
        rIndex += 1;
      }
    }
  });

  return highlights;
}

function generateHighlight(
  baseHighlight: AnvilHighlightInfo,
  childCount: number,
  alignment: FlexLayerAlignment,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition | undefined,
  tallestWidget: LayoutElementPosition | undefined,
  prevHighlight: AnvilHighlightInfo | undefined,
  isFinalHighlight: boolean,
  isDropTarget: boolean,
): AnvilHighlightInfo {
  let posX = 0;
  if (!currDimension) {
    // Initial highlight
    posX =
      layoutDimension.left + getStartPosition(alignment, layoutDimension.width);
  } else if (isFinalHighlight) {
    posX = Math.min(
      currDimension.left + currDimension.width,
      layoutDimension.left + layoutDimension.width - HIGHLIGHT_SIZE,
    );
  } else {
    // highlight before a widget.
    posX = Math.max(currDimension.left - HIGHLIGHT_SIZE, layoutDimension.left);
  }

  const multiplier = isDropTarget ? 1 : HORIZONTAL_DROP_ZONE_MULTIPLIER;

  return {
    ...baseHighlight,
    alignment,
    dropZone: {
      left: Math.max(
        prevHighlight
          ? (posX - prevHighlight.posX) * multiplier
          : (posX - layoutDimension.left) *
              (alignment === FlexLayerAlignment.Start ? 1 : multiplier),
        HIGHLIGHT_SIZE,
      ),
      right: Math.max(
        isFinalHighlight
          ? (layoutDimension.left + layoutDimension.width - posX) *
              (alignment === FlexLayerAlignment.End ? 1 : multiplier)
          : HIGHLIGHT_SIZE,
        HIGHLIGHT_SIZE,
      ),
    },
    height: tallestWidget?.height ?? layoutDimension.height,
    posX,
    posY: tallestWidget ? tallestWidget?.top : layoutDimension.top,
    rowIndex: childCount,
  };
}

function updateHighlights(
  arr: AnvilHighlightInfo[],
  baseHighlight: AnvilHighlightInfo,
  childCount: number,
  alignment: FlexLayerAlignment,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition | undefined,
  tallestWidget: LayoutElementPosition | undefined,
  isFinalHighlight: boolean,
  isDropTarget: boolean,
): AnvilHighlightInfo[] {
  const prevHighlight: AnvilHighlightInfo | undefined = arr.length
    ? arr[arr.length - 1]
    : undefined;
  const curr: AnvilHighlightInfo = generateHighlight(
    baseHighlight,
    childCount,
    alignment as FlexLayerAlignment,
    layoutDimension,
    currDimension,
    tallestWidget,
    prevHighlight,
    isFinalHighlight,
    isDropTarget,
  );
  if (prevHighlight) {
    arr[arr.length - 1] = {
      ...prevHighlight,
      dropZone: { ...prevHighlight.dropZone, right: curr.dropZone.left },
    };
  }
  arr.push(curr);
  return arr;
}

interface AlignmentInfo {
  [key: string]: {
    dimension: LayoutElementPosition; // Size and position of the alignment.
    meta: RowMetaInformation; // If alignment is wrapped, then get information about each row. Widgets per row and tallest widget in every row.
    widgets: WidgetLayoutProps[]; // Widgets belonging to the alignment.
  };
}

/**
 * Extract information about each alignment in this layout.
 * @param layoutId
 * @param layout
 * @param getDimensions
 * @returns AlignmentInfo
 */
function extractAlignmentInfo(
  layoutId: string,
  layout: WidgetLayoutProps[],
  getDimensions: GetDimensions,
): AlignmentInfo {
  const map: { [key: string]: any } = {
    [FlexLayerAlignment.Start]: {
      dimension: getDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.Start),
      ),
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.Center]: {
      dimension: getDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.Center),
      ),
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.End]: {
      dimension: getDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.End),
      ),
      meta: [],
      widgets: [],
    },
  };

  // Extract widgets based on alignments
  layout.forEach((each: WidgetLayoutProps) => {
    map[each.alignment].widgets.push(each);
  });

  // Extract meta information on rows occupied by each alignment.
  Object.keys(map).forEach((alignment: string) => {
    const { widgets } = map[alignment];
    const meta: RowMetaInformation = extractMetaInformation(
      widgets,
      getDimensions,
    );
    map[alignment].meta = meta;
  });

  return map;
}
