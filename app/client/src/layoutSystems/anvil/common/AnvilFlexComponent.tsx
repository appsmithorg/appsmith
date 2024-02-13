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

const anvilWidgetStyleProps: CSSProperties = {
  position: "relative",
  // overflow is set to make sure widgets internal components/divs don't overflow this boundary causing scrolls
  overflow: "hidden",
};

/**
 * Adds the following functionalities to the widget:
 * 1. Click handler to select the widget and open the property pane.
 * 2. Widget size based on responsiveBehavior:
 *   2a. Hug widgets will stick to the size provided to them. (flex: 0 0 auto;)
 *   2b. Fill widgets will automatically take up all available width in the parent container. (flex: 1 1 0%;)
 * 3. Widgets can optionally have auto width or height which is dictated by the props.
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
      widgetId,
      widgetSize,
      widgetType,
    }: AnvilFlexComponentProps,
    ref: any,
  ) => {
    // State to manage whether the widget is a fill widget
    const [isFillWidget, setIsFillWidget] = useState<boolean>(false);

    // The `anvil-widget-wrapper` className is necessary for the following features
    // "Vertical Alignment" and "Asymmetric Padding". The code for the same can be found in `src/index.css`
    // Please do not remove this class.
    const _className = `${className} anvil-widget-wrapper`;

    // State to manage vertical alignment of the widget
    const [verticalAlignment, setVerticalAlignment] =
      useState<FlexVerticalAlignment>(FlexVerticalAlignment.Top);

    // Effect to update state based on widget type
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
        data.minHeight = minHeight;
        data.minWidth = minWidth;
      }
      return data;
    }, [isFillWidget, widgetSize, verticalAlignment, flexGrow]);

    // Render the Anvil Flex Component using the Flex component from WDS
    return (
      <Flex
        {...flexProps}
        className={_className}
        id={getAnvilWidgetDOMId(widgetId)}
        ref={ref}
        style={anvilWidgetStyleProps}
      >
        <div className="h-full w-full">{children}</div>
      </Flex>
    );
  },
);
