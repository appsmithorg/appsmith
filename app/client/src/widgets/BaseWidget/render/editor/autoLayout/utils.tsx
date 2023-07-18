import WidgetComponentBoundary from "components/editorComponents/WidgetComponentBoundary";
import React, { ReactNode } from "react";
import Skeleton from "widgets/Skeleton";

const addWidgetComponentBoundary = (
  content: ReactNode,
  widgetProps: { type: string },
) => (
  <WidgetComponentBoundary widgetType={widgetProps.type}>
    {content}
  </WidgetComponentBoundary>
);

export const getWidgetComponent = (
  props: {
    type: string;
    deferRender: boolean;
    isFlexChild: boolean;
    detachFromLayout: boolean;
    resizeDisabled: boolean;
  },
  content: ReactNode,
) => {
  /**
   * The widget mount calls the withWidgetProps with the widgetId and type to fetch the
   * widget props. During the computation of the props (in withWidgetProps) if the evaluated
   * values are not present (which will not be during mount), the widget type is changed to
   * SKELETON_WIDGET.
   *
   * Note:- This is done to retain the old rendering flow without any breaking changes.
   * This could be refactored into not changing the widget type but to have a boolean flag.
   */
  if (props.type === "SKELETON_WIDGET" || props.deferRender) {
    return <Skeleton />;
  }

  if (props.isFlexChild && !props.detachFromLayout) {
    return content;
  }

  return addWidgetComponentBoundary(content, props);
};

export const makeResizable = (content: ReactNode) => {
  const { componentHeight, componentWidth } = this.isAutoLayoutMode
    ? this.getAutoLayoutComponentDimensions()
    : this.getComponentDimensions();
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    this.props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(this.props);
  }
  const Resizer = this.isAutoLayoutMode
    ? AutoLayoutResizableComponent
    : ResizableComponent;
  return (
    <Resizer
      {...this.props}
      {...{ componentHeight, componentWidth }}
      hasAutoHeight={autoDimensionConfig?.height}
      hasAutoWidth={autoDimensionConfig?.width}
      paddingOffset={WIDGET_PADDING}
    >
      {content}
    </Resizer>
  );
};
