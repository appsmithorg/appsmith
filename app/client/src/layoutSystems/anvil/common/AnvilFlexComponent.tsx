import React, { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { Flex } from "@design-system/widgets";
import { useSelector } from "react-redux";

import { snipingModeSelector } from "selectors/editorSelectors";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { checkIsDropTarget } from "utils/WidgetFactoryHelpers";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import {
  getIsResizing,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { ResponsiveBehavior } from "layoutSystems/anvil/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import { RenderModes, WIDGET_PADDING } from "constants/WidgetConstants";
import type { FlexComponentProps } from "layoutSystems/anvil/utils/autoLayoutTypes";

export type AnvilFlexComponentProps = FlexComponentProps & {
  hasAutoWidth: boolean;
  hasAutoHeight: boolean;
  widgetSize?: { [key: string]: Record<string, string | number> };
};

// Using a button to wrap the widget to ensure that accessibility features are included by default.
const FlexComponentWrapper = styled.button<{ onHoverZIndex: number }>`
  padding: 0;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  background: none;
  height: 100%;
  width: 100%;
  position: relative;

  &:hover {
    z-index: ${({ onHoverZIndex }) => onHoverZIndex};
  }
`;

export const AnvilFlexComponent = (props: AnvilFlexComponentProps) => {
  const isSnipingMode = useSelector(snipingModeSelector);
  const isResizing = useSelector(getIsResizing);
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isCurrentWidgetResizing = isResizing && isSelected;
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));

  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e);
    },
    [props.widgetId, clickToSelectWidget],
  );

  const { onHoverZIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    isFocused,
    isSelected,
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

  const wrappedChildren = (children: ReactNode) =>
    props.renderMode === RenderModes.PAGE ? (
      <div className="w-full h-full">{children}</div>
    ) : (
      children
    );

  const isFillWidget = props.responsiveBehavior === ResponsiveBehavior.Fill;

  const updateMinWidth = (
    config: Record<string, string | number> | undefined,
  ): Record<string, string | number> | undefined => {
    if (!config)
      return isFillWidget ? { base: "100%", "480px": "" } : undefined;
    if (!isFillWidget) return config;
    const minWidth = config["base"];
    return {
      ...config,
      base: "100%",
      "480px": config["480px"] || minWidth,
    };
  };

  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: props.flexVerticalAlignment,
      flexGrow: isFillWidget ? 1 : 0,
      flexShrink: isFillWidget ? 1 : 0,
      flexBasis: isFillWidget ? "0%" : "auto",
      height:
        props.hasAutoHeight || isCurrentWidgetResizing
          ? "auto"
          : props.componentHeight.toString(),
      maxHeight:
        props.widgetSize?.maxHeight &&
        Object.keys(props.widgetSize?.maxHeight).length
          ? { ...props.widgetSize?.maxHeight }
          : undefined,
      maxWidth:
        props.widgetSize?.maxWidth &&
        Object.keys(props.widgetSize?.maxWidth).length
          ? { ...props.widgetSize?.maxWidth }
          : undefined,
      minHeight:
        props.widgetSize?.minHeight &&
        Object.keys(props.widgetSize?.minHeight).length
          ? { ...props.widgetSize?.minHeight }
          : undefined,
      // Setting a base of 100% for Fill widgets to ensure that they expand on smaller sizes.
      minWidth: updateMinWidth(props.widgetSize?.minWidth),
      padding: WIDGET_PADDING + "px",
      width:
        isFillWidget || props.hasAutoWidth || isCurrentWidgetResizing
          ? "auto"
          : props.componentWidth.toString(),
    };
  }, [
    isCurrentWidgetResizing,
    isFillWidget,
    props.componentHeight,
    props.hasAutoHeight,
    props.hasAutoWidth,
    props.componentWidth,
    props.flexVerticalAlignment,
    props.widgetSize,
  ]);

  return (
    <Flex alignSelf={props.flexVerticalAlignment} {...flexProps}>
      <FlexComponentWrapper
        className={className}
        onClick={stopEventPropagation}
        onClickCapture={onClickFn}
        onHoverZIndex={onHoverZIndex}
      >
        {wrappedChildren(props.children)}
      </FlexComponentWrapper>
    </Flex>
  );
};
