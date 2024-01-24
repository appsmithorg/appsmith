import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { Flex } from "@design-system/widgets";
import { useSelector } from "react-redux";

import { snipingModeSelector } from "selectors/editorSelectors";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import type { AnvilFlexComponentProps } from "../utils/types";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetConfigProps } from "WidgetProvider/constants";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { useWidgetBorderStyles } from "./hooks/useWidgetBorderStyles";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { AppState } from "@appsmith/reducers";

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

export function AnvilFlexComponent(props: AnvilFlexComponentProps) {
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  /** POSITIONS OBSERVER LOGIC */
  // Create a ref so that this DOM node can be
  // observed by the observer for changes in size
  const ref = React.useRef<HTMLDivElement>(null);
  usePositionObserver(
    "widget",
    { widgetId: props.widgetId, layoutId: props.layoutId },
    ref,
  );
  /** EO POSITIONS OBSERVER LOGIC */

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
      )} t--widget-${props.widgetName.toLowerCase()} drop-target-${
        props.layoutId
      } row-index-${props.rowIndex} anvil-widget-wrapper`,
    [
      props.parentId,
      props.widgetId,
      props.widgetType,
      props.widgetName,
      props.layoutId,
      props.rowIndex,
    ],
  );

  // Memoize flex props to be passed to the WDS Flex component.
  // If the widget is being resized => update width and height to auto.
  const flexProps: FlexProps = useMemo(() => {
    const data: FlexProps = {
      alignSelf: verticalAlignment || FlexVerticalAlignment.Top,
      flexGrow: props.flexGrow ? props.flexGrow : isFillWidget ? 1 : 0,
      flexShrink: isFillWidget ? 1 : 0,
      flexBasis: isFillWidget ? "0%" : "auto",
      padding: "spacing-1",
      alignItems: "center",
    };
    if (props.widgetSize) {
      const { maxHeight, maxWidth, minHeight, minWidth } = props.widgetSize;
      data.maxHeight = maxHeight;
      data.maxWidth = maxWidth;
      data.minHeight = minHeight ?? { base: "sizing-12" };
      data.minWidth = minWidth;
    }
    return data;
  }, [isFillWidget, props.widgetSize, verticalAlignment, props.flexGrow]);

  const borderStyles = useWidgetBorderStyles(props.widgetId);

  const styleProps: CSSProperties = useMemo(() => {
    return {
      position: "relative",
      // overflow is set to make sure widgets internal components/divs don't overflow this boundary causing scrolls
      overflow: "hidden",
      opacity: (isDragging && isSelected) || !props.isVisible ? 0.5 : 1,
      "&:hover": {
        zIndex: onHoverZIndex,
      },
      ...borderStyles,
    };
  }, [borderStyles, isDragging, isSelected, onHoverZIndex]);

  return (
    <Flex
      {...flexProps}
      className={className}
      id={getAnvilWidgetDOMId(props.widgetId)}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      ref={ref}
      style={styleProps}
    >
      {props.children}
    </Flex>
  );
}
