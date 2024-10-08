import React, { forwardRef, useMemo } from "react";
import type { CSSProperties } from "react";
import { Flex } from "@appsmith/wds";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { FlexProps } from "@appsmith/wds/src/components/Flex/src/types";
import type { AnvilFlexComponentProps } from "../utils/types";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetConfigProps } from "WidgetProvider/constants";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { Layers } from "constants/Layers";
import { noop } from "utils/AppsmithUtils";
import { convertFlexGrowToFlexBasis } from "../sectionSpaceDistributor/utils/spaceDistributionEditorUtils";
import styles from "./styles.module.css";
import { AnvilDataAttributes } from "ee/modules/ui-builder/ui/wds/constants";

const anvilWidgetStyleProps: CSSProperties = {
  position: "relative",
  zIndex: Layers.positionedWidget,
  // add transition ease-in animation when there is a flexgrow value change
  transition: "flex-grow 0.1s ease-in",
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
      onClick = noop,
      onClickCapture = noop,
      widgetId,
      widgetName,
      widgetSize,
      widgetType,
    }: AnvilFlexComponentProps,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: any,
  ) => {
    const _className = `${className} ${styles.anvilWidgetWrapper}`;
    const widgetConfigProps = useMemo(() => {
      const widgetConfig:
        | (Partial<WidgetProps> & WidgetConfigProps & { type: string })
        | undefined = WidgetFactory.getConfig(widgetType);
      const isFillWidget =
        widgetConfig?.responsiveBehavior === ResponsiveBehavior.Fill;
      const verticalAlignment =
        widgetConfig?.flexVerticalAlignment || FlexVerticalAlignment.Top;

      return { isFillWidget, verticalAlignment };
    }, [widgetType]);
    // Memoize flex props to be passed to the WDS Flex component.
    // If the widget is being resized => update width and height to auto.
    const flexProps: FlexProps = useMemo(() => {
      const { isFillWidget, verticalAlignment } = widgetConfigProps;
      let flexBasis = "auto";

      if (flexGrow) {
        // flexGrow is a widget property present only for zone widgets which represents the number of columns the zone occupies in a section.
        // pls refer to convertFlexGrowToFlexBasis for more details.
        flexBasis = convertFlexGrowToFlexBasis(flexGrow);
      } else if (isFillWidget) {
        flexBasis = "0%";
      }

      const data: FlexProps = {
        alignSelf: verticalAlignment || FlexVerticalAlignment.Top,
        flexGrow: isFillWidget ? 1 : 0,
        flexShrink: isFillWidget ? 1 : 0,
        flexBasis,
        alignItems: "center",
        width: "fit-content",
      };

      if (widgetSize) {
        const {
          maxHeight,
          maxWidth,
          minHeight,
          minWidth,
          paddingBottom,
          paddingTop,
        } = widgetSize;

        data.maxHeight = maxHeight;
        data.maxWidth = maxWidth;
        data.minHeight = minHeight;
        data.minWidth = minWidth;
        data.paddingTop = paddingTop;
        data.paddingBottom = paddingBottom;
      }

      return data;
    }, [widgetConfigProps, widgetSize, flexGrow]);
    const testDataAttributes = {
      [AnvilDataAttributes.WIDGET_NAME]: widgetName,
    };

    // Render the Anvil Flex Component using the Flex component from WDS
    return (
      <Flex
        isInner
        {...flexProps}
        {...testDataAttributes}
        className={_className}
        data-testid="t--anvil-widget-wrapper"
        data-widget-wrapper=""
        id={getAnvilWidgetDOMId(widgetId)}
        onClick={onClick}
        onClickCapture={onClickCapture}
        ref={ref}
        style={anvilWidgetStyleProps}
      >
        {children}
      </Flex>
    );
  },
);
