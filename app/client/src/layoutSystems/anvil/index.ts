import { RenderModes } from "constants/WidgetConstants";
import { AnvilEditorWrapper } from "./editor/AnvilEditorWrapper";
import { AnvilViewerWrapper } from "./viewer/AnvilViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAutoLayoutComponentDimensions } from "utils/ComponentSizeUtils";
import type { AutoDimensionOptions, AutoLayoutConfig } from "widgets/constants";
import {
  getAutoDimensionsConfig,
  getAutoLayoutWidgetConfig,
  restructureWidgetSizeConfig,
} from "layoutSystems/common/utils/commonUtils";

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
    getAutoLayoutComponentDimensions(props);
  return {
    ...props,
    ...autoDimension,
    componentHeight,
    componentWidth,
    widgetSize,
  };
};

const getAnvilSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) return AnvilEditorWrapper;
  return AnvilViewerWrapper;
};

export function getAnvilSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getAnvilSystemWrapper(renderMode),
    propertyEnhancer: getAnvilSystemPropsEnhancer,
  };
}
