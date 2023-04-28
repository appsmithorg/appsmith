// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
import type { ContainerWidgetProps } from "../ContainerWidget/widget";
import type { WidgetProps } from "../BaseWidget";

export enum DynamicContainerLayouts {
  "100_0" = "100_0",
  "50_50" = "50_50",
  "75_25" = "75_25",
  "25_75" = "25_75",
  "33_66" = "33_66",
  "66_33" = "66_33",
  "33_33_33" = "33_33_33",
  "25_50_25" = "25_50_25",
}

export const DynamicContainerLayoutNames: Record<
  DynamicContainerLayouts,
  string
> = {
  [DynamicContainerLayouts["100_0"]]: "100 (single)",
  [DynamicContainerLayouts["50_50"]]: "50/50",
  [DynamicContainerLayouts["75_25"]]: "75/25",
  [DynamicContainerLayouts["25_75"]]: "25/75",
  [DynamicContainerLayouts["33_66"]]: "33/66",
  [DynamicContainerLayouts["66_33"]]: "66/33",
  [DynamicContainerLayouts["33_33_33"]]: "33/33/33",
  [DynamicContainerLayouts["25_50_25"]]: "25/50/25",
};

export const DynamicContainerLayoutPercentages: Record<
  DynamicContainerLayouts,
  number[]
> = {
  [DynamicContainerLayouts["100_0"]]: [100],
  [DynamicContainerLayouts["50_50"]]: [50, 50],
  [DynamicContainerLayouts["75_25"]]: [75, 25],
  [DynamicContainerLayouts["25_75"]]: [25, 75],
  [DynamicContainerLayouts["33_66"]]: [33, 66],
  [DynamicContainerLayouts["66_33"]]: [66, 33],
  [DynamicContainerLayouts["33_33_33"]]: [33, 33, 33],
  [DynamicContainerLayouts["25_50_25"]]: [25, 50, 25],
};

/**
 * Props used only by the component
 */
export interface DynamicContainerComponentProps extends WidgetProps {
  layout: DynamicContainerLayouts;
  /**
   * If true, the CanvasView will rely on CSS Grid. It would make harder the DnD of widgets.
   */
  previewLayoutInCanvas: boolean;
}

/**
 * Props carrying everything for the widget, container and component itself.
 */
export interface DynamicContainerWidgetProps
  extends ContainerWidgetProps<WidgetProps>,
    DynamicContainerComponentProps {}

export const DYNAMIC_CONTAINER_CLASS = "dynamic-container-wrapper";
