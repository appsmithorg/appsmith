import { Flex } from "@design-system/widgets";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import type {
  AlignSelfValues,
  FlexDirectionValues,
  FlexWrapValues,
  JustifyContentValues,
  OverflowValues,
  PositionValues,
} from "layoutSystems/anvil/utils/autoLayoutTypes";
import {
  MOBILE_BREAKPOINT,
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "layoutSystems/anvil/utils/constants";
import { addPixelToSize } from "layoutSystems/common/utils/commonUtils";
import React, { useMemo } from "react";
import type { ReactNode } from "react";

interface FlexLayoutProps {
  canvasId: string;
  children: ReactNode;
  isDropTarget?: boolean;
  layoutId: string;

  alignSelf?: AlignSelfValues;
  border?: string;
  columnGap?: string;
  flexBasis?: string;
  flexDirection: FlexDirectionValues;
  flexGrow?: number;
  flexShrink?: number;
  flexWrap?: FlexWrapValues;
  height?: string;
  justifyContent?: JustifyContentValues;
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
      columnGap: props.columnGap || 0,
      display: "flex",
      flexDirection: props.flexDirection || "column",
      flexGrow: props.flexGrow || 0,
      flexShrink: props.flexShrink || 0,
      flexBasis: props.flexBasis || "auto",
      flexWrap: props.flexWrap || "nowrap",
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
