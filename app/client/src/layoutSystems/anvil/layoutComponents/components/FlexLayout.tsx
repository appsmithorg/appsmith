import { Flex } from "@design-system/widgets";
import type {
  AlignSelf,
  FlexDirection,
  FlexProps,
  FlexWrap,
  JustifyContent,
  Responsive,
  SizingDimension,
  SpacingDimension,
} from "@design-system/widgets";
import { ROW_GAP } from "layoutSystems/common/utils/constants";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/types";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { type RenderMode, RenderModes } from "constants/WidgetConstants";

export interface FlexLayoutProps
  extends AlignSelf,
    JustifyContent,
    FlexDirection,
    FlexWrap {
  canvasId: string;
  children: ReactNode;
  isDropTarget?: boolean;
  layoutId: string;
  layoutIndex: number;
  parentDropTarget: string;
  renderMode: RenderMode;

  border?: string;
  columnGap?: Responsive<SpacingDimension>;
  flexBasis?: Responsive<SizingDimension>;
  flexGrow?: Responsive<number>;
  flexShrink?: Responsive<number>;
  height?: Responsive<SizingDimension>;
  maxHeight?: Responsive<SizingDimension>;
  maxWidth?: Responsive<SizingDimension>;
  minWidth?: Responsive<SizingDimension>;
  minHeight?: Responsive<SizingDimension>;
  overflowX?: OverflowValues;
  overflowY?: OverflowValues;
  position?: PositionValues;
  rowGap?: Responsive<SpacingDimension>;
  padding?: Responsive<SpacingDimension>;
  width?: Responsive<SizingDimension>;
}

export const FlexLayout = React.memo((props: FlexLayoutProps) => {
  const {
    alignSelf,
    border,
    canvasId,
    children,
    columnGap,
    direction,
    flexBasis,
    flexGrow,
    flexShrink,
    height,
    isDropTarget,
    justifyContent,
    layoutId,
    layoutIndex,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    parentDropTarget,
    position,
    renderMode,
    rowGap,
    width,
    wrap,
  } = props;

  /** POSITIONS OBSERVER LOGIC */
  // Create a ref so that this DOM node can be
  // observed by the observer for changes in size
  const ref = React.useRef<HTMLDivElement>(null);
  usePositionObserver(
    "layout",
    {
      layoutId: layoutId,
      canvasId: canvasId,
      isDropTarget: isDropTarget,
      parentDropTarget,
    },
    ref,
  );
  /** EO POSITIONS OBSERVER LOGIC */

  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: alignSelf || "flex-start",
      columnGap: columnGap || "0px",
      direction: direction || "column",
      flexBasis: flexBasis || "auto",
      flexGrow: flexGrow || 0,
      flexShrink: flexShrink || 0,
      height: height || "auto",
      justifyContent: justifyContent || "start",
      maxHeight: maxHeight || "none",
      maxWidth: maxWidth || "none",
      minHeight: minHeight || "unset",
      minWidth: minWidth || "unset",
      padding: padding || (isDropTarget ? "4px" : "0px"),
      rowGap: rowGap || {
        base: addPixelToSize(ROW_GAP),
      },
      width: width || "auto",
      wrap: wrap || "nowrap",
    };
  }, [
    alignSelf,
    columnGap,
    direction,
    flexBasis,
    flexGrow,
    flexShrink,
    justifyContent,
    height,
    isDropTarget,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    rowGap,
    width,
    wrap,
  ]);

  // The following properties aren't included in type FlexProps but can be passed as style.
  const styleProps: CSSProperties = useMemo(() => {
    return {
      border:
        border ||
        (isDropTarget && renderMode === RenderModes.CANVAS
          ? "1px dashed #979797"
          : "none"),
      position: position || "relative",
    };
  }, [border, isDropTarget, position, renderMode]);

  const className = useMemo(() => {
    return `layout-${layoutId} layout-index-${layoutIndex}`;
  }, [layoutId, layoutIndex]);

  return (
    <Flex
      {...flexProps}
      className={className}
      id={getAnvilLayoutDOMId(canvasId, layoutId)}
      ref={ref}
      style={styleProps}
    >
      {children}
    </Flex>
  );
});
