import React, { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { Flex } from "@design-system/widgets";
import { useSelector } from "react-redux";

import { snipingModeSelector } from "selectors/editorSelectors";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import {
  getIsResizing,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import {
  MOBILE_BREAKPOINT,
  ResponsiveBehavior,
} from "layoutSystems/anvil/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import { RenderModes, WIDGET_PADDING } from "constants/WidgetConstants";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import type { AnvilFlexComponentProps } from "../utils/types";

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

/**
 * Adds following functionalities to the widget:
 * 1. Click handler to select the widget and open property pane.
 * 2. Widget size based on responsiveBehavior:
 *   2a. Hug widgets will stick to the size provided to them. (flex: 0 0 auto;)
 *   2b. Fill widgets will automatically take up all available width in the parent container. (flex: 1 1 0%;)
 * 3. Widgets can optionally have auto width or height which is dictated by the props.
 *
 * Uses Flex component provided by WDS.
 * @param props | AnvilFlexComponentProps
 * @returns Widget
 */

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
      )} t--widget-${props.widgetName.toLowerCase()} anvil-layout`,
    [props.parentId, props.widgetId, props.widgetType, props.widgetName],
  );

  // TODO: This wrapper was introduced to solve a bug with Map widget. Will be removed as part of a fix in another task.
  const wrappedChildren = (children: ReactNode) =>
    props.renderMode === RenderModes.PAGE ? (
      <div className="w-full h-full">{children}</div>
    ) : (
      children
    );

  const isFillWidget = props.responsiveBehavior === ResponsiveBehavior.Fill;

  /**
   * Updates minWidth style for the widget based on its responsiveBehavior:
   * A Fill widget will expand to assume 100% of its parent's width when its parent width < 480px.
   * For other situations, it will adopt the minWidth provided in its widget config.
   * @param config Record<string, string | number> | undefined
   * @returns Record<string, string | number> | undefined
   */
  const getMinWidth = (
    config: Record<string, string | number> | undefined,
  ): Record<string, string | number> | undefined => {
    if (!config)
      return isFillWidget
        ? { base: "100%", [`${MOBILE_BREAKPOINT}px`]: "" }
        : undefined;
    if (!isFillWidget) return config;
    const minWidth = config["base"];
    return {
      ...config,
      base: "100%",
      [`${MOBILE_BREAKPOINT}px`]: config[`${MOBILE_BREAKPOINT}px`] || minWidth,
    };
  };

  // Memoize flex props to be passed to the WDS Flex component.
  // If the widget is being resized => update width and height to auto.
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
          ? props.widgetSize?.maxHeight
          : undefined,
      maxWidth:
        props.widgetSize?.maxWidth &&
        Object.keys(props.widgetSize?.maxWidth).length
          ? props.widgetSize?.maxWidth
          : undefined,
      minHeight:
        props.widgetSize?.minHeight &&
        Object.keys(props.widgetSize?.minHeight).length
          ? props.widgetSize?.minHeight
          : undefined,
      // Setting a base of 100% for Fill widgets to ensure that they expand on smaller sizes.
      minWidth: getMinWidth(props.widgetSize?.minWidth),
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
    <Flex {...flexProps}>
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
