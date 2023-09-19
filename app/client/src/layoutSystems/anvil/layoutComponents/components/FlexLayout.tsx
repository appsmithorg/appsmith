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
import type {
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/autoLayoutTypes";
import {
  MOBILE_BREAKPOINT,
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "layoutSystems/anvil/utils/constants";
import { getLayoutClassName } from "layoutSystems/anvil/utils/layoutUtils";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";

interface FlexLayoutProps
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
  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: props.alignSelf || "flex-start",
      columnGap: props.columnGap || "0px",
      flexDirection: props.direction || "column",
      flexGrow: props.flexGrow || 0,
      flexShrink: props.flexShrink || 0,
      flexBasis: props.flexBasis || "auto",
      flexWrap: props.wrap || "nowrap",
      justifyContent: props.justifyContent || "start",
      height: props.height || "auto",
      maxHeight: props.maxHeight || "none",
      minWidth: props.minWidth || "none",
      minHeight: props.minHeight || "none",
      width: props.width || "auto",
      padding: props.padding || "none",
      rowGap: props.rowGap || {
        base: addPixelToSize(MOBILE_ROW_GAP),
        [addPixelToSize(MOBILE_BREAKPOINT)]: addPixelToSize(ROW_GAP),
      },
    };
  }, [props]);

  // The following properties aren't included in type FlexProps but can be passed as style.
  const styleProps: CSSProperties = useMemo(() => {
    return {
      border: props.border || "none",
      overflowX: props.overflowX || "hidden",
      overflowY: props.overflowY || "hidden",
      position: props.position || "relative",
    };
  }, [props.border, props.overflowX, props.overflowY, props.position]);

  return (
    <Flex
      {...flexProps}
      className={getLayoutClassName(props.canvasId, props.layoutId)}
      style={styleProps}
    >
      {props.children}
    </Flex>
  );
};
