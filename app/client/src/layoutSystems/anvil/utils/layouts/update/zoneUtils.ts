import type { WidgetProps } from "widgets/BaseWidget";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutProps,
  type WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { zonePreset } from "layoutSystems/anvil/layoutComponents/presets/zonePreset";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";

export function createZoneAndAddWidgets(
  highlight: AnvilHighlightInfo,
  widgets: WidgetLayoutProps[],
) {
  /**
   * Step 1: Create Zone widget.
   */
  const zoneProps: WidgetProps = {
    widgetId: generateReactKey(),
    widgetName: "Zone1", // TODO: Need the function to logically add the number.
    type: "ZONE_WIDGET",
    version: 1,
    renderMode: RenderModes.CANVAS, // TODO: Remove hard coding.
    parentColumnSpace: 1,
    parentRowSpace: 10,
    leftColumn: 0,
    rightColumn: 0,
    topRow: 0,
    bottomRow: 0,
    isLoading: false,
    children: [],
    responsiveBehavior: ResponsiveBehavior.Fill,
  };

  /**
   * Step 2: Create Canvas widget and add to Zone.
   */
  const canvasProps: WidgetProps = {
    widgetId: generateReactKey(),
    widgetName: "Canvas1", // TODO: Need the function to logically add the number.
    type: "CANVAS_WIDGET",
    version: 1,
    renderMode: RenderModes.CANVAS, // TODO: Remove hard coding.
    parentColumnSpace: 1,
    parentRowSpace: 10,
    leftColumn: 0,
    rightColumn: 0,
    topRow: 0,
    bottomRow: 0,
    isLoading: false,
    children: [],
    responsiveBehavior: ResponsiveBehavior.Fill,
    layout: zonePreset(),
  };

  /**
   * Step 3: Check if layout has childTemplate
   */
  const zoneLayout: typeof BaseLayoutComponent = LayoutFactory.get(
    canvasProps.layout.layoutType,
  );

  if (zoneLayout) {
    let template: LayoutProps | null | undefined = zoneLayout.getChildTemplate(
      {
        layoutId: "",
        layoutType: LayoutComponentTypes.ZONE,
        layout: [],
      },
      widgets,
    );
    if (template) {
      if (template.insertChild) {
        template = {
          ...template,
          layout: [...template.layout, ...widgets],
        } as LayoutProps;

      }
    }
  }
}
