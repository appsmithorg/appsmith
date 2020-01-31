import { CSSProperties } from "react";
import { XYCoord } from "react-dnd";

import { theme } from "constants/DefaultTheme";
import { WidgetProps, WidgetRowCols } from "widgets/BaseWidget";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import { GridDefaults } from "constants/WidgetConstants";

export type UIElementSize = { height: number; width: number };

export const RESIZABLE_CONTAINER_BORDER_THEME_INDEX = 1;

const RESIZE_HANDLE_HOVER_AREA_WIDTH = 12;

export const getHandleSyles = (): {
  top: CSSProperties;
  bottom: CSSProperties;
  right: CSSProperties;
  left: CSSProperties;
  bottomRight: CSSProperties;
  bottomLeft: CSSProperties;
} => {
  const hoverWidth = RESIZE_HANDLE_HOVER_AREA_WIDTH;
  const hoverWidthHalf = hoverWidth / 2;
  const halfBorder =
    theme.borders[RESIZABLE_CONTAINER_BORDER_THEME_INDEX].thickness / 2;
  const shiftedHoverWidthHalf = hoverWidthHalf + halfBorder;
  const hoverCornerWidth = hoverWidth + hoverWidth / 4;

  return {
    top: {
      height: hoverWidth + "px",
      top: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ns-resize",
    },
    bottomRight: {
      height: hoverCornerWidth + "px",
      width: hoverCornerWidth + "px",
      zIndex: 1,
      cursor: "nwse-resize",
    },
    bottomLeft: {
      height: hoverCornerWidth + "px",
      width: hoverCornerWidth + "px",
      zIndex: 1,
      cursor: "nesw-resize",
    },
    bottom: {
      height: hoverWidth + "px",
      bottom: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ns-resize",
    },
    left: {
      width: hoverWidth + "px",
      left: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ew-resize",
    },
    right: {
      width: hoverWidth + "px",
      right: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ew-resize",
    },
  };
};

export const computeUpdatedRowCols = (
  isColliding: boolean,
  delta: UIElementSize,
  position: XYCoord,
  props: WidgetProps,
): WidgetRowCols | false => {
  if (isColliding) return false;
  const newRowCols: WidgetRowCols = {
    leftColumn: Math.max(
      Math.round(props.leftColumn + position.x / props.parentColumnSpace),
      0,
    ),
    topRow: Math.round(props.topRow + position.y / props.parentRowSpace),

    rightColumn: Math.min(
      Math.round(
        props.rightColumn +
          (delta.width + position.x) / props.parentColumnSpace,
      ),
      GridDefaults.DEFAULT_GRID_COLUMNS,
    ),
    bottomRow: Math.round(
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace,
    ),
  };

  if (
    props.leftColumn !== newRowCols.leftColumn ||
    props.topRow !== newRowCols.topRow ||
    props.bottomRow !== newRowCols.bottomRow ||
    props.rightColumn !== newRowCols.rightColumn
  ) {
    return newRowCols;
  }
  return false;
};

export const hasCollision = (
  delta: UIElementSize,
  position: XYCoord,
  props: WidgetProps,
  occupiedSpaces?: OccupiedSpace[],
  maxBottomRow?: number,
): boolean => {
  const left = props.leftColumn + position.x / props.parentColumnSpace;
  const top = props.topRow + position.y / props.parentRowSpace;

  const right =
    props.rightColumn + (delta.width + position.x) / props.parentColumnSpace;
  const bottom =
    props.bottomRow + (delta.height + position.y) / props.parentRowSpace;
  if (maxBottomRow && bottom - top - 1 < maxBottomRow) {
    return true;
  }

  return isDropZoneOccupied(
    {
      left: Math.round(left),
      top: Math.round(top),
      bottom: Math.round(bottom),
      right: Math.round(right),
    },
    props.widgetId,
    occupiedSpaces,
  );
};

// TODO(abhinav): Memoize this?
export const getBorderStyles = (
  isWidgetFocused: boolean,
  isColliding: boolean,
  padding: number,
): CSSProperties => {
  const selectedColor = theme.colors.widgetBorder;
  const collisionColor = theme.colors.error;

  // To fix the widget select/unselect size descripancy: Issue #127
  // Always have the border, just toggle the opacity.
  const unselectedColor = "transparent";

  const borderThickness =
    theme.borders[RESIZABLE_CONTAINER_BORDER_THEME_INDEX].thickness + "px";
  const borderStyle =
    theme.borders[RESIZABLE_CONTAINER_BORDER_THEME_INDEX].style;

  let borderColor = unselectedColor;
  if (isWidgetFocused) {
    borderColor = selectedColor;
  }
  if (isColliding && isWidgetFocused) {
    borderColor = collisionColor;
  }

  return {
    border: [borderThickness, borderStyle, borderColor].join(" "),
    padding: padding + "px",
  };
};
