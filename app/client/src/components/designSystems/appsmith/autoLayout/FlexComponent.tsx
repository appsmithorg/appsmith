import type { CSSProperties, ReactNode } from "react";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import type { RenderMode, WidgetType } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
// import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
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
import WidgetFactory from "utils/WidgetFactory";
// import { RESIZE_BORDER_BUFFER } from "resizable/common";

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
  mainCanvasWidth?: number;
  hasAutoHeight?: boolean;
  hasAutoWidth?: boolean;
};

const FlexWidget = styled.div`
  position: relative;
  background: yellowgreen;

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
  const config = WidgetFactory.widgetConfigMap.get(props.widgetType);
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

  const isResizing = useSelector(getIsResizing);
  // const widgetDimensionsViewCss = {
  //   width: props.componentWidth - WIDGET_PADDING * 2,
  //   height: props.componentHeight - WIDGET_PADDING * 2,
  //   margin: WIDGET_PADDING + "px",
  //   transform: `translate3d(${
  //     props.alignment === "end" ? "-" : ""
  //   }${WIDGET_PADDING}px, ${WIDGET_PADDING}px, 0px)`,
  // };
  // const widgetDimensionsEditCss = {
  //   width:
  //     isResizing && !props.isResizeDisabled
  //       ? "auto"
  //       : `${
  //           props.componentWidth - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
  //         }px`,
  //   height:
  //     isResizing && !props.isResizeDisabled
  //       ? "auto"
  //       : `${
  //           props.componentHeight - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
  //         }px`,
  //   margin: WIDGET_PADDING / 2 + "px",
  // };

  /**
   * TODO (Preet): Temporarily hard coding fill widget min-width to 100% for mobile viewport.
   * Move this logic to widget config.
   */
  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: "flex",
      zIndex,
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
      height: getWidgetCssHeight(
        props.hasAutoHeight,
        props.responsiveBehavior,
        config?.rows,
      ),
      width: getWidgetCssWidth(
        props.hasAutoWidth,
        props.responsiveBehavior,
        config?.columns,
      ),
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
      id={"auto_" + props.widgetId}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      style={flexComponentStyle}
    >
      {wrappedChildren(props.children)}
    </FlexWidget>
  );
}

export default FlexComponent;
