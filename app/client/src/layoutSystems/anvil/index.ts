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
  AutoDimensionValues,
  AutoLayoutConfig,
} from "WidgetProvider/constants";
import { registerLayoutComponents } from "./utils/layoutUtils";
import { getAnvilComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";

export const getAnvilDimensionsConfig = (
  props: BaseWidgetProps,
): {
  autoDimension: AutoDimensionOptions | undefined;
  widgetSize: { [key: string]: Record<string, string | number> };
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
  const { autoDimension, widgetSize } = getAnvilDimensionsConfig(props);
  const { componentHeight, componentWidth } =
    getAnvilComponentDimensions(props);
  return {
    ...props,
    componentHeight,
    componentWidth,
    hasAutoHeight: !!(autoDimension as AutoDimensionValues)?.height,
    hasAutoWidth: !!(autoDimension as AutoDimensionValues)?.width,
    widgetSize,
  };
};

const getAnvilSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) return AnvilEditorWrapper;
  return AnvilViewerWrapper;
};

export function getAnvilSystem(renderMode: RenderModes) {
  // Is this the right place to register layout components?
  registerLayoutComponents();

  return {
    LayoutSystemWrapper: getAnvilSystemWrapper(renderMode),
    propertyEnhancer: getAnvilSystemPropsEnhancer,
  };
}
