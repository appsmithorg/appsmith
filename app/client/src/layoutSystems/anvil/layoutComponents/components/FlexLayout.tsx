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
import { MOBILE_ROW_GAP, ROW_GAP } from "layoutSystems/common/utils/constants";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { MOBILE_BREAKPOINT } from "layoutSystems/anvil/utils/constants";
import type {
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/types";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";

export interface FlexLayoutProps
  extends AlignSelf,
    JustifyContent,
    FlexDirection,
    FlexWrap {
  canvasId: string;
  children: ReactNode;
  isDropTarget?: boolean;
  layoutId: string;

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

export const FlexLayout = (props: FlexLayoutProps) => {
  /** POSITIONS OBSERVER LOGIC */
  // Create a ref so that this DOM node can be
  // observed by the observer for changes in size
  const ref = React.useRef<HTMLDivElement>(null);
  usePositionObserver(
    "layout",
    {
      layoutId: props.layoutId,
      canvasId: props.canvasId,
      isDropTarget: props.isDropTarget,
    },
    ref,
  );
  /** EO POSITIONS OBSERVER LOGIC */

  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: props.alignSelf || "flex-start",
      columnGap: props.columnGap || "0px",
      direction: props.direction || "column",
      flexGrow: props.flexGrow || 0,
      flexShrink: props.flexShrink || 0,
      flexBasis: props.flexBasis || "auto",
      justifyContent: props.justifyContent || "start",
      height: props.height || "auto",
      maxHeight: props.maxHeight || "none",
      maxWidth: props.maxWidth || "none",
      minHeight: props.minHeight || "unset",
      minWidth: props.minWidth || "unset",
      width: props.width || "auto",
      padding: props.padding || (props.isDropTarget ? "4px" : "0px"),
      rowGap: props.rowGap || {
        base: addPixelToSize(MOBILE_ROW_GAP),
        [addPixelToSize(MOBILE_BREAKPOINT)]: addPixelToSize(ROW_GAP),
      },
      wrap: props.wrap || "nowrap",
    };
  }, [props]);

  // The following properties aren't included in type FlexProps but can be passed as style.
  const styleProps: CSSProperties = useMemo(() => {
    return {
      border:
        props.border || (props.isDropTarget ? "1px dashed #979797" : "none"),
      position: props.position || "relative",
    };
  }, [props.border, props.isDropTarget, props.position]);

  return (
    <Flex
      {...flexProps}
      id={getAnvilLayoutDOMId(props.canvasId, props.layoutId)}
      ref={ref}
      style={styleProps}
    >
      {props.children}
    </Flex>
  );
};
