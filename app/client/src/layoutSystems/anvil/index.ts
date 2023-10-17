import { RenderModes } from "constants/WidgetConstants";
import { AnvilEditorWrapper } from "./editor/AnvilEditorWrapper";
import { AnvilViewerWrapper } from "./viewer/AnvilViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import {
  getAutoDimensionsConfig,
  getAutoLayoutWidgetConfig,
  restructureWidgetSizeConfig,
} from "layoutSystems/common/utils/commonUtils";
import type {
  AutoDimensionOptions,
  AutoLayoutConfig,
} from "WidgetProvider/constants";
import { getAnvilComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";
import type { LayoutSystem } from "layoutSystems/types";
import { AnvilCanvas } from "./canvas/AnvilCanvas";
import { generateDefaultLayoutPreset } from "./layoutComponents/presets/DefaultLayoutPreset";

export const getAnvilDimensionsConfig = (
  props: BaseWidgetProps,
): {
  autoDimension: AutoDimensionOptions | undefined;
  widgetSize: { [key: string]: Record<string, string> };
} => {
  const config: AutoLayoutConfig = getAutoLayoutWidgetConfig(props);
  return {
    autoDimension: getAutoDimensionsConfig(config, props),
    widgetSize: restructureWidgetSizeConfig(config.widgetSize, props),
  };
};

/**
 * getAnvilSystemPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Anvil specific props
 *
 */
const getAnvilSystemPropsEnhancer = (props: BaseWidgetProps) => {
  const { widgetSize } = getAnvilDimensionsConfig(props);
  const { componentHeight, componentWidth } =
    getAnvilComponentDimensions(props);
  return {
    ...props,
    componentHeight,
    componentWidth,
    hasAutoHeight: true,
    hasAutoWidth: true,
    widgetSize,
  };
};

const getAnvilSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) return AnvilEditorWrapper;
  return AnvilViewerWrapper;
};

/**
 * getAnvilCanvasWrapper
 *
 * utility function to return the anvil system canvas implementation.
 *
 * @returns current canvas component.
 */
const getAnvilCanvasWrapper = () => {
  return AnvilCanvas;
};

/**
 * getAnvilCanvasPropsEnhancer
 *
 * utility function to return the anvil system wrapper.
 * wrapper is the component that wraps around a widget to provide layout-ing ability and enable editing experience.
 *
 * @returns current render mode specific wrapper.
 */
const getAnvilCanvasPropsEnhancer = (props: BaseWidgetProps) => {
  return {
    ...props,
    layout: props?.layout,
  };
};

export function getAnvilLayoutSystem(renderMode: RenderModes): LayoutSystem {
  return {
    canvasSystem: {
      Canvas: getAnvilCanvasWrapper(),
      propertyEnhancer: getAnvilCanvasPropsEnhancer,
    },
    widgetSystem: {
      WidgetWrapper: getAnvilSystemWrapper(renderMode),
      propertyEnhancer: getAnvilSystemPropsEnhancer,
    },
  };
}
