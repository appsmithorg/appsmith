import type { CSSProperties, ReactNode } from "react";
import React, { useCallback, useMemo, useEffect, useRef } from "react";
import styled from "styled-components";

import type { RenderMode, WidgetType } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
import type {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { checkIsDropTarget } from "utils/WidgetFactoryHelpers";
import { RESIZE_BORDER_BUFFER } from "resizable/common";
import { widgetPositionsObserver } from "utils/WidgetPositionsObserver";
import { getAutoWidgetId } from "utils/WidgetPositionsObserver/utils";

export type AutoLayoutProps = {
  alignment: FlexVerticalAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  direction: LayoutDirection;
  focused?: boolean;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  isResizeDisabled?: boolean;
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  parentColumnSpace: number;
  flexVerticalAlignment: FlexVerticalAlignment;
  isMobile: boolean;
  renderMode: RenderMode;
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

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      widgetPositionsObserver.observeWidget(
        props.widgetId,
        getAutoWidgetId(props.widgetId),
        ref,
      );
    }

    return () => {
      widgetPositionsObserver.unObserveWidget(getAutoWidgetId(props.widgetId));
    };
  }, []);

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

  const wrappedChildren = (children: ReactNode) =>
    props.renderMode === RenderModes.PAGE ? (
      <div className="w-full h-full">{children}</div>
    ) : (
      children
    );

  const className = useMemo(
    () =>
      `auto-layout-parent-${props.parentId} auto-layout-child-${
        props.widgetId
      } ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName.toLowerCase()}`,
    [props.parentId, props.widgetId, props.widgetType, props.widgetName],
  );
  const isPreviewMode = useSelector(previewModeSelector);

  const isResizing = useSelector(getIsResizing);
  const widgetDimensionsViewCss = {
    width: props.componentWidth - WIDGET_PADDING * 2,
    height: props.componentHeight - WIDGET_PADDING * 2,
    margin: WIDGET_PADDING + "px",
    transform: `translate3d(${
      props.alignment === "end" ? "-" : ""
    }${WIDGET_PADDING}px, ${WIDGET_PADDING}px, 0px)`,
  };
  const widgetDimensionsEditCss = {
    width:
      isResizing && !props.isResizeDisabled
        ? "auto"
        : `${
            props.componentWidth - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
          }px`,
    height:
      isResizing && !props.isResizeDisabled
        ? "auto"
        : `${
            props.componentHeight - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
          }px`,
    margin: WIDGET_PADDING / 2 + "px",
  };
  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: "flex",
      zIndex,
      ...(props.renderMode === "PAGE"
        ? widgetDimensionsViewCss
        : widgetDimensionsEditCss),
      minHeight: "30px",
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
    isPreviewMode,
    onHoverZIndex,
  ]);

  return (
    <FlexWidget
      className={className}
      data-testid="test-widget"
      data-widgetname-cy={props.widgetName}
      id={getAutoWidgetId(props.widgetId)}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      ref={ref}
      style={flexComponentStyle}
    >
      {wrappedChildren(props.children)}
    </FlexWidget>
  );
}

export default FlexComponent;
