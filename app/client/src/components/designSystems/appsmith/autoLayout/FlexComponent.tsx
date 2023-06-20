import type { CSSProperties, ReactNode } from "react";
import React, { useCallback, useMemo, useEffect, useRef } from "react";
import styled from "styled-components";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { RenderMode, WidgetType } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsResizing, isWidgetSelected } from "selectors/widgetSelectors";
import type {
  FlexVerticalAlignment,
  LayoutDirection,
} from "utils/autoLayout/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { checkIsDropTarget } from "utils/WidgetFactoryHelpers";
import {
  getWidgetCssHeight,
  getWidgetCssWidth,
  getWidgetMinMaxDimensionsInPixel,
} from "utils/autoLayout/flexWidgetUtils";
import type { MinMaxSize } from "utils/autoLayout/flexWidgetUtils";
import { widgetPositionsObserver } from "utils/WidgetPositionsObserver";
import { getAutoWidgetId } from "utils/WidgetPositionsObserver/utils";
import { getAutoLayoutCanvasMetaWidth } from "selectors/autoLayoutSelectors";

export type AutoLayoutProps = {
  alignment: FlexVerticalAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  direction: LayoutDirection;
  childIndex?: number;
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
  mainCanvasWidth?: number;
  hasAutoHeight?: boolean;
  hasAutoWidth?: boolean;
};

const FlexWidget = styled.div`
  position: relative;

  &.fill-widget {
    flex-grow: 9999;
    flex-shrink: 1;
    flex-basis: 0%;
  }

  &.hug-widget {
    flex-grow: 0;
    flex-shrink: 0;
  }
`;

export function FlexComponent(props: AutoLayoutProps) {
  const isSnipingMode = useSelector(snipingModeSelector);

  const {
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
  }: { [key in keyof MinMaxSize]: number | undefined } =
    getWidgetMinMaxDimensionsInPixel(
      { type: props.widgetType },
      props.mainCanvasWidth || 1,
    );

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
  }, [props.childIndex, props.alignment]);

  const isResizing = useSelector(getIsResizing);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isCurrentWidgetResizing = isResizing && isSelected;
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    props.focused,
    isSelected,
  );

  useEffect(() => {
    if (ref.current?.style) {
      ref.current.style.zIndex = zIndex.toString();
    }
  }, [zIndex]);

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
      )} t--widget-${props.widgetName.toLowerCase()} ${
        props.responsiveBehavior === ResponsiveBehavior.Fill
          ? "fill-widget"
          : "hug-widget"
      }`,
    [
      props.parentId,
      props.responsiveBehavior,
      props.widgetId,
      props.widgetType,
      props.widgetName,
    ],
  );
  const isPreviewMode = useSelector(previewModeSelector);
  /**
   * TODO (Preet): Temporarily hard coding fill widget min-width to 100% for mobile viewport.
   * Move this logic to widget config.
   */
  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(
      state,
      props.parentId || MAIN_CONTAINER_WIDGET_ID,
    ),
  );
  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: "flex",
      alignSelf: props.flexVerticalAlignment,
      "&:hover": {
        zIndex: onHoverZIndex + " !important",
      },
      minWidth:
        props.responsiveBehavior === ResponsiveBehavior.Fill && props.isMobile
          ? "calc(100% - 8px)"
          : minWidth
          ? `${minWidth}px`
          : undefined,
      maxWidth: maxWidth ? `${maxWidth}px` : undefined,
      minHeight: minHeight ? `${minHeight}px` : undefined,
      maxHeight: maxHeight ? `${maxHeight}px` : undefined,
      height: isCurrentWidgetResizing
        ? `auto`
        : getWidgetCssHeight(
            props.hasAutoHeight,
            props.responsiveBehavior,
            props.componentHeight,
          ),
      width: isCurrentWidgetResizing
        ? `auto`
        : getWidgetCssWidth(
            props.hasAutoWidth,
            props.responsiveBehavior,
            props.componentWidth,
            parentWidth,
          ),
    };
  }, [
    props.isMobile,
    props.componentWidth,
    props.componentHeight,
    props.flexVerticalAlignment,
    isCurrentWidgetResizing,
    zIndex,
    isResizing,
    isPreviewMode,
    onHoverZIndex,
    parentWidth,
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
