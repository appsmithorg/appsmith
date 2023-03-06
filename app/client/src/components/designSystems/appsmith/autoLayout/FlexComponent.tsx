import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import styled from "styled-components";

import { WidgetType, WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
import {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { checkIsDropTarget } from "utils/WidgetFactoryHelpers";

export type AutoLayoutProps = {
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  direction?: LayoutDirection;
  focused?: boolean;
  minWidth?: number;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  parentColumnSpace: number;
  flexVerticalAlignment: FlexVerticalAlignment;
  isMobile?: boolean;
};

const FlexWidget = styled.div`
  position: relative;
`;

export function FlexComponent(props: AutoLayoutProps) {
  const isSnipingMode = useSelector(snipingModeSelector);

  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e);
    },
    [props.widgetId, clickToSelectWidget],
  );

  const isDropTarget = checkIsDropTarget(props.widgetType);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    props.focused,
    props.selected,
  );

  const stopEventPropagation = (e: any) => {
    !isSnipingMode && e.stopPropagation();
  };

  const className = useMemo(
    () =>
      `auto-layout-parent-${props.parentId} auto-layout-child-${
        props.widgetId
      } ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName.toLowerCase()}`,
    [props.parentId, props.widgetId, props.widgetType, props.widgetName],
  );

  const isResizing = useSelector(getIsResizing);

  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: "flex",
      zIndex,
      width: isResizing
        ? "auto"
        : `${props.componentWidth - WIDGET_PADDING * 2}px`,
      height: isResizing
        ? "auto"
        : props.componentHeight - WIDGET_PADDING * 2 + "px",
      minHeight: "30px",
      margin: WIDGET_PADDING + "px",
      alignSelf: props.flexVerticalAlignment,
      "&:hover": {
        zIndex: onHoverZIndex + " !important",
      },
    };
  }, [
    props.isMobile,
    props.componentWidth,
    props.componentHeight,
    props.flexVerticalAlignment,
    zIndex,
    isResizing,
    onHoverZIndex,
  ]);

  return (
    <FlexWidget
      className={className}
      data-testid="test-widget"
      data-widgetname-cy={props.widgetName}
      id={"auto_" + props.widgetId}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      style={flexComponentStyle}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
