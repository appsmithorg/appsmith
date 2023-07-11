import AutoLayoutDimensionObserver from "components/designSystems/appsmith/autoLayout/AutoLayoutDimensionObeserver";
import FlexComponent from "components/designSystems/appsmith/autoLayout/FlexComponent";
import { RenderModes } from "constants/WidgetConstants";
import { isFunction } from "lodash";
import type { ReactNode } from "react";
import React from "react";
import {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetProps, WidgetState } from "./BaseWidget";
import Skeleton from "./Skeleton";
import { getWidgetMinMaxDimensionsInPixel } from "utils/autoLayout/flexWidgetUtils";
import type BaseWidget from "./BaseWidget";

export const getAutoLayoutProps = (
  props: WidgetProps,
  baseWidgetContext: BaseWidget<WidgetProps, WidgetState>,
) => {
  const calculateWidgetBounds = (
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number,
    mobileLeftColumn?: number,
    mobileRightColumn?: number,
    mobileTopRow?: number,
    mobileBottomRow?: number,
    isMobile?: boolean,
  ): {
    componentWidth: number;
    componentHeight: number;
  } => {
    let left = leftColumn;
    let right = rightColumn;
    let top = topRow;
    let bottom = bottomRow;
    if (isMobile) {
      if (mobileLeftColumn !== undefined && parentColumnSpace !== 1) {
        left = mobileLeftColumn;
      }
      if (mobileRightColumn !== undefined && parentColumnSpace !== 1) {
        right = mobileRightColumn;
      }
      if (mobileTopRow !== undefined && parentRowSpace !== 1) {
        top = mobileTopRow;
      }
      if (mobileBottomRow !== undefined && parentRowSpace !== 1) {
        bottom = mobileBottomRow;
      }
    }

    return {
      componentWidth: (right - left) * parentColumnSpace,
      componentHeight: (bottom - top) * parentRowSpace,
    };
  };

  const getWidgetComponent = (widgetContent: ReactNode) => {
    const { type } = props;

    /**
     * The widget mount calls the withWidgetProps with the widgetId and type to fetch the
     * widget props. During the computation of the props (in withWidgetProps) if the evaluated
     * values are not present (which will not be during mount), the widget type is changed to
     * SKELETON_WIDGET.
     *
     * Note:- This is done to retain the old rendering flow without any breaking changes.
     * This could be refactored into not changing the widget type but to have a boolean flag.
     */
    if (type === "SKELETON_WIDGET" || props.deferRender) {
      return <Skeleton />;
    }

    let content = widgetContent;

    if (!props.detachFromLayout) {
      const autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
        props.type,
      ).autoDimension;

      const shouldObserveWidth = isFunction(autoDimensionConfig)
        ? autoDimensionConfig(props).width
        : autoDimensionConfig?.width;
      const shouldObserveHeight = isFunction(autoDimensionConfig)
        ? autoDimensionConfig(props).height
        : autoDimensionConfig?.height;

      if (!shouldObserveHeight && !shouldObserveWidth) return content;

      const { componentHeight, componentWidth } = getComponentDimensions();

      const { minHeight, minWidth } = getWidgetMinMaxDimensionsInPixel(
        props,
        props.mainCanvasWidth || 0,
      );

      return (
        <AutoLayoutDimensionObserver
          height={componentHeight}
          isFillWidget={props.responsiveBehavior === ResponsiveBehavior.Fill}
          minHeight={minHeight ?? 0}
          minWidth={minWidth ?? 0}
          onDimensionUpdate={baseWidgetContext.updateWidgetDimensions}
          shouldObserveHeight={shouldObserveHeight || false}
          shouldObserveWidth={shouldObserveWidth || false}
          type={props.type}
          width={componentWidth}
        >
          {content}
        </AutoLayoutDimensionObserver>
      );
    }

    content = baseWidgetContext.addWidgetComponentBoundary(content, props);
    return baseWidgetContext.addErrorBoundary(content);
  };

  const makeFlex = (content: ReactNode) => {
    const { componentHeight, componentWidth } = getComponentDimensions();
    return (
      <FlexComponent
        alignment={props.alignment}
        componentHeight={componentHeight}
        componentWidth={componentWidth}
        direction={props.direction || LayoutDirection.Horizontal}
        flexVerticalAlignment={
          props.flexVerticalAlignment || FlexVerticalAlignment.Bottom
        }
        focused={props.focused}
        isMobile={props.isMobile || false}
        isResizeDisabled={props.resizeDisabled}
        parentColumnSpace={props.parentColumnSpace}
        parentId={props.parentId}
        renderMode={props.renderMode}
        responsiveBehavior={props.responsiveBehavior}
        selected={props.selected}
        widgetId={props.widgetId}
        widgetName={props.widgetName}
        widgetType={props.type}
      >
        {content}
      </FlexComponent>
    );
  };

  const getWidgetView = (widgetContent: ReactNode): ReactNode => {
    let content: ReactNode;

    switch (props.renderMode) {
      case RenderModes.CANVAS:
        content = getWidgetComponent(widgetContent);
        if (!props.detachFromLayout) {
          if (!props.resizeDisabled && props.type !== "SKELETON_WIDGET")
            content = baseWidgetContext.makeResizable(content);
          content = baseWidgetContext.showWidgetName(content);
          content = baseWidgetContext.makeDraggable(content);
          content = baseWidgetContext.makeSnipeable(content);

          content = makeFlex(content);
        }

        return content;

      // return getCanvasView();
      case RenderModes.PAGE:
        content = getWidgetComponent(widgetContent);
        if (!props.detachFromLayout) {
          content = makeFlex(content);
        }
        return content;
      default:
        throw Error("RenderMode not defined");
    }
  };

  const getComponentDimensions = () => {
    return calculateWidgetBounds(
      props.rightColumn,
      props.leftColumn,
      props.topRow,
      props.bottomRow,
      props.parentColumnSpace,
      props.parentRowSpace,
      props.mobileLeftColumn,
      props.mobileRightColumn,
      props.mobileTopRow,
      props.mobileBottomRow,
      props.isMobile,
    );
  };

  return {
    getComponentDimensions: getComponentDimensions,
    getWidgetView: getWidgetView,
  };
};
