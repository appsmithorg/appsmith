import { Flex } from "@design-system/widgets";
import type {
  AlignSelf,
  FlexDirection,
  FlexProps,
  FlexWrap,
  JustifyContent,
} from "@design-system/widgets";
import { MOBILE_BREAKPOINT } from "layoutSystems/anvil/utils/constants";
import type {
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/types";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import { MOBILE_ROW_GAP, ROW_GAP } from "layoutSystems/common/utils/constants";
import React, { useMemo } from "react";
import type { ReactNode } from "react";

interface FlexLayoutProps
  extends AlignSelf,
    FlexDirection,
    FlexWrap,
    JustifyContent {
  canvasId: string;
  children: ReactNode;
  isDropTarget?: boolean;
  layoutId: string;

  border?: string;
  columnGap?: string;
  flexBasis?: string;
  flexGrow?: number;
  flexShrink?: number;
  height?: string;
  maxHeight?: string;
  maxWidth?: string;
  minWidth?: string;
  minHeight?: string;
  overflowX?: OverflowValues;
  overflow?: OverflowValues;
  position?: PositionValues;
  rowGap?: string;
  padding?: string;
  width?: string;
}

export const FlexLayout = (props: FlexLayoutProps) => {
  const layoutStyle: FlexProps = useMemo(() => {
    return {
      alignSelf: props.alignSelf || "flex-start",
      columnGap: props.columnGap || "0px",
      flexDirection: props.direction || "column",
      flexGrow: props.flexGrow || 0,
      flexShrink: props.flexShrink || 0,
      flexBasis: props.flexBasis || "auto",
      flexWrap: props.wrap || "nowrap",
      justifyContent: props.justifyContent || "start",
      overflowX: props.overflowX || "hidden",
      overflowY: props.overflow || "hidden",
      height: props.height || "auto",
      maxHeight: props.maxHeight || "none",
      minWidth: props.minWidth || "none",
      minHeight: props.minHeight || "none",
      position: props.position || "relative",
      width: props.width || "auto",
      border: props.border || "none",
      padding: props.padding || "none",
      rowGap: props.rowGap || {
        base: addPixelToSize(MOBILE_ROW_GAP),
        [addPixelToSize(MOBILE_BREAKPOINT)]: addPixelToSize(ROW_GAP),
      },
    };
  }, [props]);

  return <Flex {...layoutStyle}>{props.children}</Flex>;
};
