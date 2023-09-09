/* eslint-disable no-console */
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
import { RenderModes } from "constants/WidgetConstants";
import type { FlexComponentProps } from "layoutSystems/anvil/utils/autoLayoutTypes";

export type AnvilFlexComponentProps = FlexComponentProps & {
  hasAutoWidth: boolean;
  hasAutoHeight: boolean;
  widgetSize?: { [key: string]: Record<string, string | number> };
};

const FlexComponentWrapper = styled.button<{ onHoverZIndex: number }>`
  padding: 0;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  background: none;
  width: -webkit-fill-available;
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
  console.log("####", { props });
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
      minHeight: { ...props.widgetSize?.minHeight },
      // Setting a base of 100% for Fill widgets to ensure that they expand on smaller sizes.
      minWidth: {
        ...props.widgetSize?.minWidth,
        base: isFillWidget
          ? "100%"
          : props.widgetSize?.minWidth["base"] || undefined,
      },
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
  console.log("####", { flexProps });
  // const styleProps: React.CSSProperties = useMemo(() => {
  //   return {};
  //   return {
  //     position: "static",
  //     "&:hover": {
  //       zIndex: onHoverZIndex + " !important",
  //     },
  //   };
  // }, [onHoverZIndex]);

  return (
    <FlexComponentWrapper
      className={className}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      onHoverZIndex={onHoverZIndex}
    >
      <Flex alignSelf={props.flexVerticalAlignment} {...flexProps}>
        {wrappedChildren(props.children)}
      </Flex>
    </FlexComponentWrapper>
  );
};
