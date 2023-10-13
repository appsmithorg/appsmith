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

export function deriveAlignedRowHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  if (!draggedWidgets.length) return [];
  const { layout, layoutId, layoutType } = layoutProps;
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
    return getInitialHighlights(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
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
  draggedWidgets: DraggedWidget[],
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
    const alignmentDimension: WidgetPosition =
      widgetPositions[`${layoutProps.layoutId}-${index}`];
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
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  draggedWidgets: DraggedWidget[],
  baseHighlight: AnvilHighlightInfo,
): AnvilHighlightInfo[] {
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];
  const layoutDimension: WidgetPosition = widgetPositions[layoutProps.layoutId];

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
          /**
           * Add a highlight before the widget
           */
          temp = updateHighlights(
            temp,
            baseHighlight,
            childCount,
            alignment as FlexLayerAlignment,
            dimension,
            widgetPositions[each.widgetId],
            widgetPositions[tallestWidget.widgetId],
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
              widgetPositions[each.widgetId],
              widgetPositions[tallestWidget.widgetId],
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
    posX =
      layoutDimension.left + getStartPosition(alignment, layoutDimension.width);
  } else if (isFinalHighlight) {
    posX = Math.min(
      currDimension.left + currDimension.width + HIGHLIGHT_SIZE / 2,
      layoutDimension.left + layoutDimension.width - HIGHLIGHT_SIZE / 2,
    );
  } else {
    posX = Math.max(
      currDimension.left - HIGHLIGHT_SIZE / 2,
      layoutDimension.left + HIGHLIGHT_SIZE / 2,
    );
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
    posY: tallestWidget?.top ?? layoutDimension.top,
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
): AlignmentInfo {
  const map: { [key: string]: any } = {
    [FlexLayerAlignment.Start]: {
      dimension:
        widgetPositions[
          getAlignmentLayoutId(layoutId, FlexLayerAlignment.Start)
        ],
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.Center]: {
      dimension:
        widgetPositions[
          getAlignmentLayoutId(layoutId, FlexLayerAlignment.Center)
        ],
      meta: [],
      widgets: [],
    },
    [FlexLayerAlignment.End]: {
      dimension:
        widgetPositions[getAlignmentLayoutId(layoutId, FlexLayerAlignment.End)],
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
    );
    map[alignment].meta = meta;
  });

  return map;
}
