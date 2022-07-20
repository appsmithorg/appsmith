import { WidgetType } from "constants/WidgetConstants";
import styled, { css } from "styled-components";
import React, { ReactNode, useCallback } from "react";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { LayoutDirection } from "./constants";

export type AutoLayoutProps = {
  children: ReactNode;
  widgetId: string;
  widgetType: WidgetType;
  useAutoLayout?: boolean;
  alignItems: string;
  direction?: LayoutDirection;
  parentId?: string;
};

const AutoLayout = styled("div")<{ styles: any }>`
  position: unset;
  margin: 8px;
  ${({ styles }) =>
    styles.useAutoLayout && styles.alignItems === "stretch"
      ? css`
          width: calc(100% - 16px);
          height: auto;
          min-height: 30px;
        `
      : ""}
`;

export function AutoLayoutWrapper(props: AutoLayoutProps) {
  const clickToSelectWidget = useClickToSelectWidget();
  let size = {},
    margin = {};
  if (props.useAutoLayout && props.alignItems === "stretch") {
    size = {
      width: "100%",
      height: "auto",
    };
  }
  if (props.useAutoLayout && props.direction === LayoutDirection.Vertical) {
    margin = {
      marginTop: 8,
      marginBottom: 4,
    };
  } else {
    margin = {
      marginLeft: 8,
      marginRight: 8,
    };
  }
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e, props.widgetId);
    },
    [props.widgetId, clickToSelectWidget],
  );

  return (
    <AutoLayout
      className={`${props.parentId}-auto-layout auto-layout-child-${props.widgetId}`}
      onClickCapture={onClickFn}
      {...props}
      styles={{
        useAutoLayout: props.useAutoLayout,
        alignItems: props.alignItems,
      }}
    >
      {props.children}
    </AutoLayout>
  );
}
