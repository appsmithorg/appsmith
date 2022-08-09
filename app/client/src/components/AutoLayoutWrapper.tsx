import { WidgetType } from "constants/WidgetConstants";
import styled from "styled-components";
import React, { ReactNode, useCallback } from "react";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { AlignItems, LayoutDirection } from "./constants";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { checkIsDropTarget } from "./designSystems/appsmith/PositionedContainer";
import { getSelectedWidgets } from "selectors/ui";
import { Layers } from "constants/Layers";

export type AutoLayoutProps = {
  children: ReactNode;
  widgetId: string;
  widgetType: WidgetType;
  useAutoLayout?: boolean;
  alignItems?: AlignItems;
  direction?: LayoutDirection;
  parentId?: string;
};

const AutoLayout = styled("div")<{
  alignItems?: AlignItems;
  direction?: LayoutDirection;
  useAutoLayout?: boolean;
}>`
  position: unset;
  width: fit-content;
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
  margin: 8px;
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
      onClickCapture={onClickFn}
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
