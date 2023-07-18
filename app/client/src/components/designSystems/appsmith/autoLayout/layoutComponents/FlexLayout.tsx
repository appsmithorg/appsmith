import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";

interface FlexLayoutProps {
  alignSelf?: string;
  children: ReactNode;
  columnGap?: number;
  flexDirection: "row" | "column";
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  height?: number | string;
  justifyContent?: "flex-start" | "flex-end" | "center";
  maxHeight?: string;
  minWidth?: string;
  minHeight?: string;
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  rowGap?: number;
  width?: string;
}

const FlexLayout = (props: FlexLayoutProps) => {
  const layoutStyle: CSSProperties = useMemo(() => {
    return {
      alignSelf: props.alignSelf || "start",
      columnGap: props.columnGap || 0,
      display: "flex",
      flexDirection: props.flexDirection,
      flex: `${props.flexGrow || 0} ${props.flexShrink || 0} ${
        props.flexBasis || "auto"
      }`,
      flexGrow: props.flexGrow || 0,
      flexShrink: props.flexShrink || 0,
      flexBasis: props.flexBasis || "auto",
      flexWrap: props.flexWrap || "nowrap",
      justifyContent: props.justifyContent || "flex-start",
      overflowX: props.overflowX || "hidden",
      overflowY: props.overflow || "hidden",
      height: props.height || "auto",
      maxHeight: props.maxHeight,
      minWidth: props.minWidth,
      minHeight: props.minHeight,
      rowGap: props.rowGap || 0,
      width: props.width,
    };
  }, [props]);
  return <div style={layoutStyle}>{props.children}</div>;
};

export default FlexLayout;
