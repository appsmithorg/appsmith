import { WidgetType } from "constants/WidgetConstants";
import styled from "styled-components";
import React, { ReactNode, useCallback } from "react";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { AlignItems, LayoutDirection, ResponsiveBehavior } from "./constants";
import { useSelector } from "react-redux";

import { checkIsDropTarget } from "./designSystems/appsmith/PositionedContainer";
import { getSelectedWidgets } from "selectors/ui";
import { Layers } from "constants/Layers";
import { AppState } from "ce/reducers";

export type AutoLayoutProps = {
  children: ReactNode;
  widgetId: string;
  widgetType: WidgetType;
  useAutoLayout?: boolean;
  alignItems?: AlignItems;
  direction?: LayoutDirection;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  isWrapper?: boolean;
};

const AutoLayout = styled("div")<{
  alignItems?: AlignItems;
  direction?: LayoutDirection;
  useAutoLayout?: boolean;
  responsiveBehavior?: ResponsiveBehavior;
  isWrapper?: boolean;
}>`
  position: unset;
  width: auto;
  flex: ${({ responsiveBehavior }) =>
    responsiveBehavior === ResponsiveBehavior.Fill
      ? "1 1 auto"
      : "0 1 fit-content"};
  align-self: ${({ isWrapper, responsiveBehavior }) =>
    responsiveBehavior === ResponsiveBehavior.Fill || isWrapper
      ? "stretch"
      : "auto"};
`;

const ZIndexContainer = styled.div<{
  alignItems?: AlignItems;
  direction?: LayoutDirection;
  zIndex: number;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex || Layers.positionedWidget};

  width: ${({ alignItems, direction }) =>
    alignItems === AlignItems.Stretch && direction === LayoutDirection.Vertical
      ? "calc(100% - 16px)"
      : "auto"};
  height: ${({ alignItems, direction }) =>
    alignItems === AlignItems.Stretch &&
    direction === LayoutDirection.Horizontal
      ? "calc(100% - 16px)"
      : "auto"};
  min-height: 30px;
`;

export function AutoLayoutWrapper(props: AutoLayoutProps) {
  const clickToSelectWidget = useClickToSelectWidget();
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e, props.widgetId);
    },
    [props.widgetId, clickToSelectWidget],
  );

  const isDropTarget = checkIsDropTarget(props.widgetType);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const isThisWidgetDragging =
    isDragging && selectedWidgets.includes(props.widgetId);

  const zIndex =
    isDragging && !(!isThisWidgetDragging && isDropTarget)
      ? -1
      : Layers.positionedWidget + 1;

  return (
    <AutoLayout
      alignItems={props.alignItems}
      direction={props.direction}
      isWrapper={props.isWrapper}
      onClickCapture={onClickFn}
      responsiveBehavior={props.responsiveBehavior}
      useAutoLayout={props.useAutoLayout}
    >
      <ZIndexContainer
        alignItems={props.alignItems}
        className={`auto-layout-parent-${props.parentId} auto-layout-child-${props.widgetId}`}
        direction={props.direction}
        zIndex={zIndex}
      >
        {props.children}
      </ZIndexContainer>
    </AutoLayout>
  );
}
