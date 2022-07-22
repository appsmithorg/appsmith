import { WidgetType } from "constants/WidgetConstants";
import styled from "styled-components";
import React, { ReactNode, useCallback } from "react";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { AlignItems, LayoutDirection } from "./constants";

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
  margin: 8px;
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

  return (
    <AutoLayout
      alignItems={props.alignItems}
      className={`auto-layout-parent-${props.parentId} auto-layout-child-${props.widgetId}`}
      direction={props.direction}
      onClickCapture={onClickFn}
      useAutoLayout={props.useAutoLayout}
    >
      {props.children}
    </AutoLayout>
  );
}
