import "./styles.css";
import { Flex } from "@appsmith/wds";
import type { FlexProps } from "@appsmith/wds";
import React, { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { PositionValues } from "layoutSystems/anvil/utils/types";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { useSelector } from "react-redux";
import {
  getAnvilHighlightShown,
  getShouldHighLightCellSelector,
} from "layoutSystems/anvil/integrations/selectors";

export interface FlexLayoutProps extends FlexProps {
  canvasId: string;
  children: ReactNode;
  isContainer?: boolean;
  isDropTarget?: boolean;
  layoutId: string;
  layoutIndex: number;
  layoutType: LayoutComponentTypes;
  parentDropTarget: string;
  position?: PositionValues;
}

export const FlexLayout = React.memo((props: FlexLayoutProps) => {
  const {
    alignSelf,
    canvasId,
    children,
    className,
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
    width,
    wrap,
    ...rest
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
  }, [isDropTarget, position, shouldHighlightCell]);

  const _className = useMemo(() => {
    return `${className ?? ""} layout-${layoutId} layout-index-${layoutIndex} ${
      isContainer ? "make-container" : ""
    }`;
  }, [isContainer, layoutId, layoutIndex]);

  return (
    <Flex
      {...flexProps}
      {...rest}
      className={_className}
      id={getAnvilLayoutDOMId(canvasId, layoutId)}
      ref={ref}
      style={styleProps}
    >
      {children}
    </Flex>
  );
});
