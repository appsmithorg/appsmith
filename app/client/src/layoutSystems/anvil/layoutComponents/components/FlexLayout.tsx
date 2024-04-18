import "./styles.css";
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
import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/types";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { RenderMode } from "constants/WidgetConstants";
import type { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { useSelector } from "react-redux";
import {
  getAnvilHighlightShown,
  getShouldHighLightCellSelector,
} from "layoutSystems/anvil/integrations/selectors";

export interface FlexLayoutProps
  extends AlignSelf,
    JustifyContent,
    FlexDirection,
    FlexWrap {
  canvasId: string;
  children: ReactNode;
  isContainer?: boolean;
  isDropTarget?: boolean;
  layoutId: string;
  layoutIndex: number;
  layoutType: LayoutComponentTypes;
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
  gap?: Responsive<SpacingDimension>;
  padding?: Responsive<SpacingDimension>;
  width?: Responsive<SizingDimension>;
  className?: string;
}

export const FlexLayout = React.memo((props: FlexLayoutProps) => {
  const {
    alignSelf,
    border,
    canvasId,
    children,
    className,
    columnGap,
    direction,
    flexBasis,
    flexGrow,
    flexShrink,
    gap,
    height,
    isContainer,
    isDropTarget,
    justifyContent,
    layoutId,
    layoutIndex,
    layoutType,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    parentDropTarget,
    position,
    renderMode,
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
      isDropTarget,
      layoutType,
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
      padding: padding || "spacing-0",
      gap: gap || "spacing-3",
      width: width || "auto",
      wrap: wrap || "nowrap",
      className: className || "",
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
    gap,
    width,
    wrap,
  ]);
  const shouldHighlightCell = useSelector((state) =>
    getShouldHighLightCellSelector(state, layoutId, layoutType),
  );
  const highlightShown = useSelector(getAnvilHighlightShown);
  highlightShown?.rowIndex;
  // The following properties aren't included in type FlexProps but can be passed as style.
  const styleProps: CSSProperties = useMemo(() => {
    return {
      position: position || "relative",
      ...(shouldHighlightCell
        ? { background: "var(--anvil-cell-highlight)" }
        : {}),
    };
  }, [border, isDropTarget, position, renderMode, shouldHighlightCell]);

  const _className = useMemo(() => {
    return `${className ?? ""} layout-${layoutId} layout-index-${layoutIndex} ${
      isContainer ? "make-container" : ""
    }`;
  }, [isContainer, layoutId, layoutIndex]);

  return (
    <Flex
      {...flexProps}
      className={_className}
      id={getAnvilLayoutDOMId(canvasId, layoutId)}
      ref={ref}
      style={styleProps}
    >
      {children}
    </Flex>
  );
});
