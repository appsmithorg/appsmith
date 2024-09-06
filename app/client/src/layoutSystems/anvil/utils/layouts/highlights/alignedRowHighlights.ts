import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  GetDimensions,
  HighlightPayload,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE } from "../../constants";
import {
  getNonDraggedWidgets,
  getStartPosition,
  performInitialChecks,
} from "./highlightUtils";
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
  ): HighlightPayload => {
    const { layout } = layoutProps;

    /**
     * Step 0: Perform initial checks before calculating highlights.
     * There are situations where highlight calculations are not required.
     */
    const res: HighlightPayload | undefined = performInitialChecks(
      layoutProps,
      positions,
      draggedWidgets,
    );

    if (res) return res;

    const getDimensions: (id: string) => LayoutElementPosition =
      getRelativeDimensions(positions);

    /**
     * Step 2: Construct a base highlight.
     */
    const baseHighlight: AnvilHighlightInfo = {
      layoutId: layoutProps.layoutId,
      alignment: FlexLayerAlignment.Start,
      canvasId,
      height: 0,
      isVertical: true,
      layoutOrder,
      posX: HIGHLIGHT_SIZE / 2,
      posY: HIGHLIGHT_SIZE / 2,
      rowIndex: 0,
      width: HIGHLIGHT_SIZE,
      edgeDetails: {
        bottom: false,
        left: false,
        right: false,
        top: false,
      },
    };

    /**
     * Step 3: Check if layout is empty and appropriately return initial set of highlights.
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
     * Step 4: Derive highlights for widgets.
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
 * @returns HighlightPayload.
 */
/**
 * Retrieves the initial highlights for a layout.
 *
 * @param layoutProps - The properties of the layout.
 * @param baseHighlight - The base highlight to be used.
 * @param draggedWidgets - The array of dragged widgets.
 * @param getDimensions - The function to get the dimensions of a layout element.
 * @returns The payload containing the highlights and a flag indicating whether to skip the entity.
 */
function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
): HighlightPayload {
  let highlights: AnvilHighlightInfo[] = [];

  // Check if dragged widgets contain a Fill widget.
  const hasFillWidget: boolean = draggedWidgets.some(
    (widget: DraggedWidget) =>
      widget.responsiveBehavior === ResponsiveBehavior.Fill,
  );

  /**
   * If dragged widgets contain a fill widget,
   * then draw a single highlight that spans the width of the layout.
   * Otherwise, draw three highlights, one for each alignment.
   */
  const alignments = hasFillWidget
    ? [FlexLayerAlignment.Start]
    : [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ];

  alignments.forEach((alignment: FlexLayerAlignment, index: number) => {
    const alignmentId: string = `${layoutProps.layoutId}-${index}`;
    const alignmentDimension: LayoutElementPosition =
      getDimensions(alignmentId);
    highlights = updateHighlights(
      highlights,
      baseHighlight,
      index,
      alignment,
      layoutProps.layoutId,
      alignmentDimension,
      undefined,
      undefined,
      undefined,
      true,
    );
  });

  return { highlights, skipEntity: false };
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param positions | WidgetPositions
 * @param draggedWidgets | string[]
 * @param baseHighlight | AnvilHighlightInfo
 * @param getDimensions | GetDimensions
 * @returns HighlightPayload
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  positions: LayoutElementPositions,
  draggedWidgets: DraggedWidget[],
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
): HighlightPayload {
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
    const payload: HighlightPayload = getHighlightsForWidgetsRow(
      layoutProps,
      baseHighlight,
      draggedWidgets,
      getDimensions,
    );
    return payload;
  }

  /**
   * Check if the layout has widgets that are not being dragged.
   */
  const nonDraggedWidgets: WidgetLayoutProps[] = getNonDraggedWidgets(
    layout,
    draggedWidgets,
  );

  if (!nonDraggedWidgets.length && !layoutProps.isDropTarget)
    return { highlights: [], skipEntity: true };

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

  // Iterate through each alignment in the layout
  Object.keys(alignmentInfo).forEach((alignment: string) => {
    const { dimension, meta, widgets } = alignmentInfo[alignment];

    /**
     * If the alignment doesn't render any widgets,
     * then derive initial highlights for the alignment.
     */
    if (!widgets.length) {
      const isFillWidgetDragged = draggedWidgets.some(
        (widget) => widget.responsiveBehavior === ResponsiveBehavior.Fill,
      );

      if (isFillWidgetDragged) return;

      /**
       * If it is an empty Center alignment,
       * which is no longer in the center position due to the size of its siblings,
       * then don't add any highlights for it.
       */
      if (
        alignment === FlexLayerAlignment.Center &&
        alignmentInfo[FlexLayerAlignment.Start].dimension.width +
          alignmentInfo[FlexLayerAlignment.End].dimension.width >
          (layoutDimension.width * 2) / 3
      )
        return;

      highlights = updateHighlights(
        highlights,
        baseHighlight,
        childCount,
        alignment as FlexLayerAlignment,
        layoutProps.layoutId,
        dimension,
        undefined,
        undefined,
        undefined,
        true,
      );
    } else {
      const { metaData, tallestWidgets } = meta;
      let rIndex = 0;

      // Iterate through each row within the alignment
      while (rIndex < metaData.length) {
        const row: RowMetaData[] = metaData[rIndex];
        const tallestWidget = tallestWidgets[rIndex];

        let temp: AnvilHighlightInfo[] = [];
        const draggedWidgetIndices: number[] = [];

        // Iterate through each widget within the row
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
          const prevDimension: LayoutElementPosition | undefined =
            index === 0 ? undefined : getDimensions(row[index - 1].widgetId);
          const skipHighlightBeforeWidget = draggedWidgetIndices.includes(
            index - 1,
          );
          /**
           * Add a highlight before the widget
           */
          temp = updateHighlights(
            temp,
            isDraggedWidget || skipHighlightBeforeWidget
              ? { ...baseHighlight, existingPositionHighlight: true }
              : baseHighlight,
            childCount,
            alignment as FlexLayerAlignment,
            layoutProps.layoutId,
            dimension,
            currentDimension,
            tallestDimension,
            prevDimension,
            false,
          );

          if (!isDraggedWidget) {
            childCount += 1;
          } else {
            draggedWidgetIndices.push(index);
          }

          if (index === row.length - 1) {
            if (!isDraggedWidget) {
              /**
               * Add a highlight after the last widget in the row.
               */
              temp = updateHighlights(
                temp,
                baseHighlight,
                childCount,
                alignment as FlexLayerAlignment,
                layoutProps.layoutId,
                dimension,
                currentDimension,
                tallestDimension,
                prevDimension,
                true,
              );
            }
            highlights.push(...temp);
            temp = [];
          }
        });
        rIndex += 1;
      }
    }
  });

  return { highlights, skipEntity: false };
}

function generateHighlight(
  layoutId: string,
  baseHighlight: AnvilHighlightInfo,
  childCount: number,
  alignment: FlexLayerAlignment,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition | undefined,
  prevDimension: LayoutElementPosition | undefined,
  tallestWidget: LayoutElementPosition | undefined,
  isFinalHighlight: boolean,
): AnvilHighlightInfo {
  let posX = 0;
  if (!currDimension) {
    // Initial highlight
    posX =
      layoutDimension.left + getStartPosition(alignment, layoutDimension.width);
  } else if (isFinalHighlight) {
    const gap: number =
      layoutDimension.left +
      layoutDimension.width -
      currDimension.left -
      currDimension.width;
    posX = Math.min(
      currDimension.left + currDimension.width,
      layoutDimension.left +
        layoutDimension.width -
        gap / 2 -
        HIGHLIGHT_SIZE / 2,
      layoutDimension.left + layoutDimension.width - HIGHLIGHT_SIZE,
    );
  } else {
    // highlight before a widget.
    const gap: number = prevDimension
      ? currDimension.left - (prevDimension.left + prevDimension.width)
      : HIGHLIGHT_SIZE;
    posX = Math.max(
      currDimension.left - gap / 2 - HIGHLIGHT_SIZE / 2,
      layoutDimension.left,
    );
  }
  const posY = tallestWidget ? tallestWidget.top : layoutDimension.top;
  const edgeDetails = {
    top: posY === layoutDimension.top,
    bottom:
      posY + HIGHLIGHT_SIZE === layoutDimension.top + layoutDimension.height,
    left: posX === layoutDimension.left,
    right:
      posX + HIGHLIGHT_SIZE === layoutDimension.left + layoutDimension.width,
  };
  return {
    ...baseHighlight,
    layoutId,
    alignment,
    height: tallestWidget?.height ?? layoutDimension.height,
    posX,
    posY,
    rowIndex: childCount,
    edgeDetails,
  };
}

function updateHighlights(
  arr: AnvilHighlightInfo[],
  baseHighlight: AnvilHighlightInfo,
  childCount: number,
  alignment: FlexLayerAlignment,
  layoutId: string,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition | undefined,
  tallestWidget: LayoutElementPosition | undefined,
  prevDimension: LayoutElementPosition | undefined,
  isFinalHighlight: boolean,
): AnvilHighlightInfo[] {
  const prevHighlight: AnvilHighlightInfo | undefined = arr.length
    ? arr[arr.length - 1]
    : undefined;

  const curr: AnvilHighlightInfo = generateHighlight(
    layoutId,
    baseHighlight,
    childCount,
    alignment as FlexLayerAlignment,
    layoutDimension,
    currDimension,
    prevDimension,
    tallestWidget,
    isFinalHighlight,
  );
  if (prevHighlight) {
    arr[arr.length - 1] = {
      ...prevHighlight,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
