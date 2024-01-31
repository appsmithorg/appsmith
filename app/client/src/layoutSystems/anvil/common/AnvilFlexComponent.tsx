import React, { forwardRef, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Flex } from "@design-system/widgets";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { FlexProps } from "@design-system/widgets/src/components/Flex/src/types";
import type { AnvilFlexComponentProps } from "../utils/types";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetConfigProps } from "WidgetProvider/constants";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { Layers } from "constants/Layers";

/**
 * Adds following functionalities to the widget:
 * 1. Click handler to select the widget and open property pane.
 * 2. Widget size based on responsiveBehavior:
 *   2a. Hug widgets will stick to the size provided to them. (flex: 0 0 auto;)
 *   2b. Fill widgets will automatically take up all available width in the parent container. (flex: 1 1 0%;)
 * 3. Widgets can optionally have auto width or height which is dictated by the
 *
 * Uses Flex component provided by WDS.
 * @param props | AnvilFlexComponentProps
 * @returns Widget
 */
export const AnvilFlexComponent = forwardRef(
  (
    {
      children,
      className,
      flexGrow,
      onHoverZIndex = Layers.positionedWidget,
      widgetId,
      widgetSize,
      widgetType,
    }: AnvilFlexComponentProps,
    ref: any,
  ) => {
    const [isFillWidget, setIsFillWidget] = useState<boolean>(false);
    const [verticalAlignment, setVerticalAlignment] =
      useState<FlexVerticalAlignment>(FlexVerticalAlignment.Top);

    useEffect(() => {
      const widgetConfig:
        | (Partial<WidgetProps> & WidgetConfigProps & { type: string })
        | undefined = WidgetFactory.getConfig(widgetType);
      if (!widgetConfig) return;
      setIsFillWidget(
        widgetConfig?.responsiveBehavior === ResponsiveBehavior.Fill,
      );
      setVerticalAlignment(
        widgetConfig?.flexVerticalAlignment || FlexVerticalAlignment.Top,
      );
    }, [widgetType]);

    // Memoize flex props to be passed to the WDS Flex component.
    // If the widget is being resized => update width and height to auto.
    const flexProps: FlexProps = useMemo(() => {
      const data: FlexProps = {
        alignSelf: verticalAlignment || FlexVerticalAlignment.Top,
        flexGrow: flexGrow ? flexGrow : isFillWidget ? 1 : 0,
        flexShrink: isFillWidget ? 1 : 0,
        flexBasis: isFillWidget ? "0%" : "auto",
        padding: "spacing-1",
        alignItems: "center",
      };
      if (widgetSize) {
        const { maxHeight, maxWidth, minHeight, minWidth } = widgetSize;
        data.maxHeight = maxHeight;
        data.maxWidth = maxWidth;
        data.minHeight = minHeight ?? { base: "sizing-12" };
        data.minWidth = minWidth;
      }
      return data;
    }, [isFillWidget, widgetSize, verticalAlignment, flexGrow]);

    const styleProps: CSSProperties = useMemo(() => {
      return {
        position: "relative",
        // overflow is set to make sure widgets internal components/divs don't overflow this boundary causing scrolls
        overflow: "hidden",
        "&:hover": {
          zIndex: onHoverZIndex,
        },
      };
    }, [onHoverZIndex]);

    return (
      <Flex
        {...flexProps}
        className={className}
        id={getAnvilWidgetDOMId(widgetId)}
        ref={ref}
        style={styleProps}
      >
        <div className="h-full w-full">{children}</div>
      </Flex>
    );
  },
);
