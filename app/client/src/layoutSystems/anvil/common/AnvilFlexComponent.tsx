import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, MouseEvent } from "react";
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
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import type { AnvilFlexComponentProps } from "../utils/types";
import {
  getResponsiveMinWidth,
  validateResponsiveProp,
} from "../utils/widgetUtils";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetConfigProps } from "WidgetProvider/constants";

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
  const ref: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));
  const isResizing = useSelector(getIsResizing);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);
  const isCurrentWidgetResizing = isResizing && isSelected;

  const [isFillWidget, setIsFillWidget] = useState<boolean>(false);
  const [verticalAlignment, setVerticalAlignment] =
    useState<FlexVerticalAlignment>(FlexVerticalAlignment.Top);

  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e);
    },
    [props.widgetId, clickToSelectWidget],
  );

  const stopEventPropagation = (e: MouseEvent<HTMLElement>) => {
    !isSnipingMode && e.stopPropagation();
  };

  useEffect(() => {
    const widgetConfig:
      | (Partial<WidgetProps> & WidgetConfigProps & { type: string })
      | undefined = WidgetFactory.getConfig(props.widgetType);
    if (!widgetConfig) return;
    setIsFillWidget(
      widgetConfig?.responsiveBehavior === ResponsiveBehavior.Fill,
    );
    setVerticalAlignment(
      widgetConfig?.flexVerticalAlignment || FlexVerticalAlignment.Top,
    );
  }, [props.widgetType]);

  useEffect(() => {
    if (ref?.current) {
      // Stop click event propagation
      ref?.current.addEventListener("click", (e: any) =>
        stopEventPropagation(e),
      );
      // Use click capture to select the widget before the click event is triggered on inner layers and component.
      ref?.current.addEventListener("click", onClickFn, { capture: true });
    }
    return () => {
      if (ref?.current) {
        ref?.current.removeEventListener("click", (e: any) =>
          stopEventPropagation(e),
        );
        ref?.current.removeEventListener("click", onClickFn, {
          capture: true,
        });
      }
    };
  }, [ref]);

  const { onHoverZIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    isFocused,
    isSelected,
  );

  const className = useMemo(
    () =>
      `anvil-layout-parent-${props.parentId} anvil-layout-child-${
        props.widgetId
      } ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName.toLowerCase()}`,
    [props.parentId, props.widgetId, props.widgetType, props.widgetName],
  );

  // Memoize flex props to be passed to the WDS Flex component.
  // If the widget is being resized => update width and height to auto.
  const flexProps: FlexProps = useMemo(() => {
    return {
      alignSelf: verticalAlignment || FlexVerticalAlignment.Top,
      flexGrow: isFillWidget ? 1 : 0,
      flexShrink: isFillWidget ? 1 : 0,
      flexBasis: isFillWidget ? "0%" : "auto",
      height:
        props.hasAutoHeight || isCurrentWidgetResizing
          ? "auto"
          : `${props.componentHeight}px`,
      maxHeight: validateResponsiveProp(props.widgetSize?.maxHeight)
        ? props.widgetSize?.maxHeight
        : undefined,
      maxWidth: validateResponsiveProp(props.widgetSize?.maxWidth)
        ? props.widgetSize?.maxWidth
        : undefined,
      minHeight: validateResponsiveProp(props.widgetSize?.minHeight)
        ? props.widgetSize?.minHeight
        : undefined,
      // Setting a base of 100% for Fill widgets to ensure that they expand on smaller sizes.
      minWidth: getResponsiveMinWidth(props.widgetSize?.minWidth, isFillWidget),
      padding: WIDGET_PADDING + "px",
      width:
        isFillWidget || props.hasAutoWidth || isCurrentWidgetResizing
          ? "auto"
          : `${props.componentWidth}px`,
    };
  }, [
    isCurrentWidgetResizing,
    isFillWidget,
    props.componentHeight,
    props.hasAutoHeight,
    props.hasAutoWidth,
    props.componentWidth,
    props.widgetSize,
    verticalAlignment,
  ]);

  const styleProps: CSSProperties = useMemo(() => {
    return {
      position: "relative",
      "&:hover": {
        zIndex: onHoverZIndex,
      },
    };
  }, [onHoverZIndex]);

  return (
    <Flex {...flexProps} className={className} ref={ref} style={styleProps}>
      {props.children}
    </Flex>
  );
};
