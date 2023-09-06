import React, { useMemo } from "react";
import type { ReactNode } from "react";
import { Flex } from "@design-system/widgets";
import { useSelector } from "react-redux";

// import {
//   previewModeSelector,
//   snipingModeSelector,
// } from "selectors/editorSelectors";
// import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { checkIsDropTarget } from "utils/WidgetFactoryHelpers";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import {
  getIsResizing,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { ResponsiveBehavior } from "layoutSystems/autolayout/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import { RenderModes } from "constants/WidgetConstants";
import type { AutoLayoutProps } from "layoutSystems/common/utils/commonTypes";

export type AnvilFlexComponentProps = AutoLayoutProps & {
  hasAutoWidth: boolean;
  hasAutoHeight: boolean;
  widgetSize?: { [key: string]: Record<string, string | number> };
};

export const AnvilFlexComponent = (props: AnvilFlexComponentProps) => {
  // const isSnipingMode = useSelector(snipingModeSelector);
  // const isPreviewMode = useSelector(previewModeSelector);
  const isResizing = useSelector(getIsResizing);
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isCurrentWidgetResizing = isResizing && isSelected;
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));

  // const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  // const onClickFn = useCallback(
  //   (e) => {
  //     clickToSelectWidget(e);
  //   },
  //   [props.widgetId, clickToSelectWidget],
  // );

  const { onHoverZIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    isFocused,
    isSelected,
  );

  // const stopEventPropagation = (e: any) => {
  //   !isSnipingMode && e.stopPropagation();
  // };

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

  const wrappedChildren = (children: ReactNode) =>
    props.renderMode === RenderModes.PAGE ? (
      <div className="w-full h-full">{children}</div>
    ) : (
      children
    );

  const isFillWidget = props.responsiveBehavior === ResponsiveBehavior.Fill;

  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: props.flexVerticalAlignment,
      flexGrow: isFillWidget ? 1 : 0,
      flexShrink: isFillWidget ? 1 : 0,
      flexBasis: isFillWidget ? "0%" : "auto",
      height:
        props.hasAutoHeight || isCurrentWidgetResizing
          ? "auto"
          : props.componentHeight,
      maxHeight: { ...props.widgetSize?.maxHeight },
      maxWidth: { ...props.widgetSize?.maxWidth },
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
          : props.componentWidth,
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

  const styleProps: React.CSSProperties = useMemo(() => {
    return {
      position: "relative",
      "&:hover": {
        zIndex: onHoverZIndex + " !important",
      },
    };
  }, [onHoverZIndex]);

  return (
    <Flex
      alignSelf={props.flexVerticalAlignment}
      className={className}
      isContainer
      // onClick={stopEventPropagation}
      // onClickCapture={onClickFn}
      style={styleProps}
      {...flexProps}
    >
      {wrappedChildren(props.children)}
    </Flex>
  );
};
