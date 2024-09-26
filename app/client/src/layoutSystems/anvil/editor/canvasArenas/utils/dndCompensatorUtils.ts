import type { Token } from "@appsmith/wds-theming";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { HIGHLIGHT_SIZE } from "layoutSystems/anvil/utils/constants";
import { EMPTY_MODAL_PADDING } from "../AnvilModalDropArena";

/**
 * DnD Compensation spacing tokens
 *
 * main canvas (Aligned Column layout component) using the value spacing-4 which is set via dsl transformer
 * section widget (WDS widget) - no tokens currently, however we extend the DnD layer on both sides of the section inorder to be able to show highlights and catch mouse movements.
 * zone widget spacing when elevated (WDS widget) - uses the --outer-spacing-3 value which is set on the widget from the container component.
 * modal component body top spacing (WDS component) - uses the --outer-spacing-2 value which is set on the WDS component
 * modal component body left spacing (WDS component) - uses the --outer-spacing-4 value which is set on the WDS component
 *
 * ToDo(#32983): These values are hardcoded here for now.
 *
 * Ideally they should be coming from a constant or from the entity it-selves as a property to the drag and drop layer.
 * But we have DnD rendering on the layout component and each of these entities are defining there spacing in different places.
 */
const CompensationSpacingTokens = {
  MAIN_CANVAS: "4",
  SECTION: "3",
  ZONE: "3",
  MODAL_TOP: "2",
  MODAL_LEFT: "4",
};

const extractFloatValuesOutOfToken = (token: Token) => {
  if (token) {
    return parseFloat(token.value + "");
  }

  return 0;
};

/**
 * Get widget spacing CSS variable values
 */
const getWidgetSpacingCSSVariableValues = (outerSpacingTokens: {
  [key: string]: Token;
}) => {
  return {
    mainCanvasSpacing: extractFloatValuesOutOfToken(
      outerSpacingTokens[CompensationSpacingTokens.MAIN_CANVAS],
    ),
    modalSpacing: {
      top: extractFloatValuesOutOfToken(
        outerSpacingTokens[CompensationSpacingTokens.MODAL_TOP],
      ),
      left: extractFloatValuesOutOfToken(
        outerSpacingTokens[CompensationSpacingTokens.MODAL_LEFT],
      ),
    },
    zoneSpacing: extractFloatValuesOutOfToken(
      outerSpacingTokens[CompensationSpacingTokens.ZONE],
    ),
    sectionSpacing: extractFloatValuesOutOfToken(
      outerSpacingTokens[CompensationSpacingTokens.SECTION],
    ),
  };
};

/**
 * Get compensators for the main canvas widget
 */
const getMainCanvasCompensators = (
  isEmptyLayout: boolean,
  mainCanvasSpacing: number,
) => {
  const widgetCompensatorValues = {
    left: -mainCanvasSpacing,
    top: 0,
  };
  const edgeCompensatorValues = {
    left: isEmptyLayout ? -mainCanvasSpacing : 0,
    top: isEmptyLayout ? -mainCanvasSpacing : mainCanvasSpacing,
  };
  const layoutCompensatorValues = {
    left: 0,
    top: 0,
  };

  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
  };
};

/**
 * Get compensators for the section widget
 */
const getSectionCompensators = (
  mainCanvasSpacing: number,
  sectionSpacing: number,
  isElevatedWidget: boolean,
) => {
  const widgetCompensatorValues = {
    left: mainCanvasSpacing,
    top: 0,
  };
  const edgeCompensatorValues = {
    left: HIGHLIGHT_SIZE * 2 + (isElevatedWidget ? sectionSpacing * 2 : 0),
    top: 0,
  };
  const layoutCompensatorValues = {
    left: mainCanvasSpacing + (isElevatedWidget ? sectionSpacing : 0),
    top: isElevatedWidget ? sectionSpacing : 0,
  };

  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
  };
};
/**
 * Get compensators for the modal widget
 */
const getModalCompensators = (
  isEmptyLayout: boolean,
  modalSpacing: {
    top: number;
    left: number;
  },
) => {
  const widgetCompensatorValues = {
    left: 0,
    top: isEmptyLayout ? 0 : modalSpacing.top,
  };
  const layoutCompensatorValues = {
    left: isEmptyLayout ? EMPTY_MODAL_PADDING : 0,
    top: isEmptyLayout ? EMPTY_MODAL_PADDING : modalSpacing.top,
  };

  return {
    widgetCompensatorValues,
    edgeCompensatorValues: widgetCompensatorValues,
    layoutCompensatorValues,
  };
};

/**
 * Get compensators for the zone widget
 */
const getZoneCompensators = (
  zoneSpacing: number,
  isElevatedWidget: boolean,
) => {
  const widgetCompensatorValues = {
    left: 0,
    top: 0,
  };
  const edgeCompensatorValues = isElevatedWidget
    ? {
        left: 0,
        top: zoneSpacing,
      }
    : {
        left: HIGHLIGHT_SIZE / 2,
        top: HIGHLIGHT_SIZE / 2,
      };
  const layoutCompensatorValues = isElevatedWidget
    ? {
        left: zoneSpacing,
        top: zoneSpacing,
      }
    : {
        left: 0,
        top: 0,
      };

  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
  };
};

/**
 * Get compensators for the widget based on the hierarchy
 */
export const getCompensatorsForHierarchy = (
  hierarchy: number,
  isEmptyLayout: boolean,
  isElevatedWidget: boolean,
  outerSpacingTokens:
    | {
        [key: string]: Token;
      }
    | undefined,
) => {
  if (!outerSpacingTokens) {
    return {
      widgetCompensatorValues: {
        left: 0,
        top: 0,
      },
      edgeCompensatorValues: {
        left: 0,
        top: 0,
      },
      layoutCompensatorValues: {
        left: 0,
        top: 0,
      },
    };
  }

  const { mainCanvasSpacing, modalSpacing, sectionSpacing, zoneSpacing } =
    getWidgetSpacingCSSVariableValues(outerSpacingTokens);

  /**
   * Get compensators based on hierarchy
   * widgetCompensatorValues - compensates for the widget's additional dragging space outside widget and its layout ( Section Widget)
   * edgeCompensatorValues - compensates for the highlights at the edges of the layout of the widget (Zone Widget)
   * layoutCompensatorValues - compensates for the layout's additional dragging space inside widget (Modal Widget)
   */
  switch (true) {
    case hierarchy === 0:
      return getMainCanvasCompensators(isEmptyLayout, mainCanvasSpacing);
    case hierarchy === 1:
      return getModalCompensators(isEmptyLayout, modalSpacing);
    case hierarchy === 2:
      return getSectionCompensators(
        mainCanvasSpacing,
        sectionSpacing,
        isElevatedWidget,
      );
    case hierarchy === 3:
      return getZoneCompensators(zoneSpacing, isElevatedWidget);
    default:
      return {
        widgetCompensatorValues: {
          left: 0,
          top: 0,
        },
        edgeCompensatorValues: {
          left: 0,
          top: 0,
        },
        layoutCompensatorValues: {
          left: 0,
          top: 0,
        },
      };
  }
};

/**
 * Calculate the top offset based on the edge details
 */
const calculateEdgeTopOffset = (
  isVertical: boolean,
  isTopEdge: boolean,
  isBottomEdge: boolean,
  topGap: number,
) => {
  return !isVertical ? (isTopEdge ? -topGap : isBottomEdge ? topGap : 0) : 0;
};

/**
 * Calculate the left offset based on the edge details
 */
const calculateEdgeLeftOffset = (
  isVertical: boolean,
  isLeftEdge: boolean,
  isRightEdge: boolean,
  leftGap: number,
) => {
  return isVertical ? (isLeftEdge ? -leftGap : isRightEdge ? leftGap : 0) : 0;
};

/**
 * Get the edge compensating offset values
 */
const getEdgeCompensatingOffsetValues = (
  highlight: AnvilHighlightInfo,
  highlightCompensatorValues: {
    top: number;
    left: number;
  },
) => {
  const {
    edgeDetails,
    height: highlightHeight,
    isVertical,
    width: highlightWidth,
  } = highlight;
  const compensatorTop = highlightCompensatorValues.top;
  const compensatorLeft = highlightCompensatorValues.left;
  const {
    bottom: isBottomEdge,
    left: isLeftEdge,
    right: isRightEdge,
    top: isTopEdge,
  } = edgeDetails;
  const topGap = (compensatorTop + highlightHeight) * 0.5;
  const leftGap = (compensatorLeft + highlightWidth) * 0.5;
  const topOffset = calculateEdgeTopOffset(
    isVertical,
    isTopEdge,
    isBottomEdge,
    topGap,
  );
  const leftOffset = calculateEdgeLeftOffset(
    isVertical,
    isLeftEdge,
    isRightEdge,
    leftGap,
  );

  return {
    topOffset,
    leftOffset,
  };
};

/**
 * Get the position compensated highlight
 */
export const getPositionCompensatedHighlight = (
  highlight: AnvilHighlightInfo,
  layoutCompensatorValues: {
    top: number;
    left: number;
  },
  edgeCompensatorValues: {
    top: number;
    left: number;
  },
): AnvilHighlightInfo => {
  const layoutCompensatedHighlight = {
    ...highlight,
    posX: highlight.posX + layoutCompensatorValues.left,
    posY: highlight.posY + layoutCompensatorValues.top,
  };
  const { posX: left, posY: top } = layoutCompensatedHighlight;
  const compensatingOffsetValues = getEdgeCompensatingOffsetValues(
    highlight,
    edgeCompensatorValues,
  );
  const positionUpdatedHighlightInfo = {
    ...layoutCompensatedHighlight,
    posX: left + compensatingOffsetValues.leftOffset,
    posY: top + compensatingOffsetValues.topOffset,
  };

  return positionUpdatedHighlightInfo;
};
