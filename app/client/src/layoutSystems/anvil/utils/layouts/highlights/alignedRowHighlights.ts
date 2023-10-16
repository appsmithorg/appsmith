import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  LayoutComponent,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import {
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
  type RowMetaData,
  type RowMetaInformation,
  extractMetaInformation,
  getHighlightsForWidgetsRow,
} from "./rowHighlights";
import { getAlignmentLayoutId } from "../layoutUtils";
import { getRelativeDimensions } from "./dimensionUtils";

export function deriveAlignedRowHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  parentDropTarget: string,
): AnvilHighlightInfo[] {
  if (!draggedWidgets.length || !widgetPositions[layoutProps.layoutId])
    return [];
  const { isDropTarget, layout, layoutId, layoutType } = layoutProps;

  const parentDropTargetId: string = isDropTarget ? layoutId : parentDropTarget;

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
      widgetPositions,
      baseHighlight,
      draggedWidgets,
      parentDropTargetId,
    );
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
    parentDropTargetId,
  );
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[]
 * @param parentDropTargetId | string
 * @returns AnvilHighlightInfo[] : List of highlights for empty AlignedRow.
 */
function getInitialHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  parentDropTargetId: string,
): AnvilHighlightInfo[] {
  let highlights: AnvilHighlightInfo[] = [];

  const hasFillWidget: boolean = draggedWidgets.some(
    (widget: DraggedWidget) =>
      widget.responsiveBehavior === ResponsiveBehavior.Fill,
  );

  const arr = hasFillWidget
    ? [FlexLayerAlignment.Start]
    : [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ];

  arr.forEach((alignment: FlexLayerAlignment, index: number) => {
    const alignmentDimension: WidgetPosition = getRelativeDimensions(
      `${layoutProps.layoutId}-${index}`,
      parentDropTargetId,
      widgetPositions,
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
    );
  });

  return highlights;
}

/**
 *
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param draggedWidgets | string[]
 * @param baseHighlight | AnvilHighlightInfo
 * @param parentDropTargetId | string
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  draggedWidgets: DraggedWidget[],
  baseHighlight: AnvilHighlightInfo,
  parentDropTargetId: string,
): AnvilHighlightInfo[] {
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];
  const layoutDimension: WidgetPosition = getRelativeDimensions(
    layoutProps.layoutId,
    parentDropTargetId,
    widgetPositions,
  );

  // If widgetPositions of alignment aren't tracked => this layout has a fill widget.
  const hasFillWidget: boolean = !widgetPositions.hasOwnProperty(
    `${layoutProps.layoutId}-0`,
  );

  /**
   * If AlignedRow has a fill widget,
   * then it renders all widgets directly without using alignments.
   */
  if (hasFillWidget) {
    const highlights: AnvilHighlightInfo[] = getHighlightsForWidgetsRow(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
      parentDropTargetId,
    );
    return highlights;
  }

  /**
   * Collect all information on alignments
   */
  const alignmentInfo: AlignmentInfo = extractAlignmentInfo(
    layoutProps.layoutId,
    layout,
    widgetPositions,
    parentDropTargetId,
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
      );
    } else {
      const { metaData, tallestWidgets } = meta;
      let rIndex = 0;
      while (rIndex < metaData.length) {
        const row: RowMetaData[] = metaData[rIndex];
        const tallestWidget = tallestWidgets[rIndex];

        let temp: AnvilHighlightInfo[] = [];
        row.forEach((each: RowMetaData, index: number) => {
          const currentDimension: WidgetPosition = getRelativeDimensions(
            each.widgetId,
            parentDropTargetId,
            widgetPositions,
          );
          const tallestDimension: WidgetPosition = getRelativeDimensions(
            tallestWidget.widgetId,
            parentDropTargetId,
            widgetPositions,
          );
          /**
           * Add a highlight before the widget
           */
          temp = updateHighlights(
            temp,
            baseHighlight,
            childCount,
            alignment as FlexLayerAlignment,
            dimension,
            currentDimension,
            tallestDimension,
            false,
          );
          childCount += 1;

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
  layoutDimension: WidgetPosition,
  currDimension: WidgetPosition | undefined,
  tallestWidget: WidgetPosition | undefined,
  prevHighlight: AnvilHighlightInfo | undefined,
  isFinalHighlight: boolean,
): AnvilHighlightInfo {
  let posX: number = 0;
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

  return {
    ...baseHighlight,
    alignment,
    dropZone: {
      left: prevHighlight
        ? (posX - prevHighlight.posX) * HORIZONTAL_DROP_ZONE_MULTIPLIER
        : (posX - layoutDimension.left) *
          (alignment === FlexLayerAlignment.Start
            ? 1
            : HORIZONTAL_DROP_ZONE_MULTIPLIER),
      right: isFinalHighlight
        ? (layoutDimension.left + layoutDimension.width - posX) *
          (alignment === FlexLayerAlignment.End
            ? 1
            : HORIZONTAL_DROP_ZONE_MULTIPLIER)
        : 0,
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
  layoutDimension: WidgetPosition,
  currDimension: WidgetPosition | undefined,
  tallestWidget: WidgetPosition | undefined,
  isFinalHighlight: boolean,
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
    dimension: WidgetPosition;
    meta: RowMetaInformation;
    widgets: WidgetLayoutProps[];
  };
}

function extractAlignmentInfo(
  layoutId: string,
  layout: WidgetLayoutProps[],
  widgetPositions: WidgetPositions,
  parentDropTargetId: string,
): AlignmentInfo {
  const map: { [key: string]: any } = {
    [FlexLayerAlignment.Start]: {
      dimension: getRelativeDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.Start),
        parentDropTargetId,
        widgetPositions,
      ),
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.Center]: {
      dimension: getRelativeDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.Center),
        parentDropTargetId,
        widgetPositions,
      ),
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.End]: {
      dimension: getRelativeDimensions(
        getAlignmentLayoutId(layoutId, FlexLayerAlignment.End),
        parentDropTargetId,
        widgetPositions,
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
      widgetPositions,
      parentDropTargetId,
    );
    map[alignment].meta = meta;
  });

  return map;
}
