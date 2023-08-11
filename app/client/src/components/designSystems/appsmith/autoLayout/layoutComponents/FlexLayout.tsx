import React, { useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { widgetPositionsObserver } from "utils/WidgetPositionsObserver";
import { getLayoutId } from "utils/WidgetPositionsObserver/utils";

interface FlexLayoutProps {
  alignSelf?: string;
  children: ReactNode;
  canvasId: string;
  columnGap?: number;
  flexDirection: "row" | "column";
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  height?: number | string;
  justifyContent?: "flex-start" | "flex-end" | "center";
  layoutId: string;
  maxHeight?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  position?: "absolute" | "relative" | "static" | "sticky";
  rowGap?: number;
  width?: string | number;
  border?: string;
  padding?: string | number;
  isDropTarget?: boolean;
}

const FlexLayout = (props: FlexLayoutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.isDropTarget)
      widgetPositionsObserver.observeLayout(
        getLayoutId(props.layoutId),
        ref,
        props.canvasId,
        props.layoutId,
      );

    return () => {
      props.isDropTarget &&
        widgetPositionsObserver.unObserveLayout(getLayoutId(props.layoutId));
    };
  }, []);

  const layoutStyle: CSSProperties = useMemo(() => {
    return {
      alignSelf: props.alignSelf || "start",
      columnGap: props.columnGap || 4,
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
      position: props.position || "relative",
      rowGap: props.rowGap || 12,
      width: props.width,
      border: props.border || "none",
      padding: props.padding,
    };
  }, [props]);
  return (
    <div id={getLayoutId(props.layoutId)} ref={ref} style={layoutStyle}>
      {props.children}
    </div>
  );
};

export default FlexLayout;
