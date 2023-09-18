import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorWrapper } from "./editor/AutoLayoutEditorWrapper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";
import {
  getAutoDimensionsConfig,
  getAutoLayoutWidgetConfig,
} from "layoutSystems/common/utils/commonUtils";
import { getAutoLayoutComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";
import type { AutoDimensionOptions } from "WidgetProvider/constants";

/**
 * getAutoLayoutDimensionsConfig
 *
 * utility function to fetch and process widget specific autoDimensionConfig(specific to Auto Layout Layout system)
 * stored on the WidgetFactory.autoLayoutConfigMap.
 *
 * @returns AutoDimensionValues | undefined
 */
export const getAutoLayoutDimensionsConfig = (
  props: BaseWidgetProps,
): AutoDimensionOptions | undefined => {
  return getAutoDimensionsConfig(getAutoLayoutWidgetConfig(props), props);
};

/**
 * getAutoLayoutSystemPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Auto Layout system specific props
 *
 * @returns EnhancedBaseWidgetProps
 *  @property {AutoDimensionValues | undefined} autoDimensionConfig The auto dimension configuration of a widget.
 *  @property {number} componentHeight The calculated height of a widget in pixels.
 *  @property {number} componentWidth The calculated width of a widget in pixels.
 *
 */

const getAutoLayoutSystemPropsEnhancer = (props: BaseWidgetProps) => {
  const autoDimensionConfig = getAutoLayoutDimensionsConfig(props);
  const { componentHeight, componentWidth } =
    getAutoLayoutComponentDimensions(props);
  return {
    ...props,
    autoDimensionConfig,
    componentHeight,
    componentWidth,
  };
};

/**
 * getAutoLayoutSystemWrapper
 *
 * utility function to return the auto layout system wrapper based on render mode.
 * wrapper is the component that wraps around a widget to provide layout-ing ability and enable editing experience.
 *
 * @returns current render mode specific wrapper.
 */

const getAutoLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorWrapper;
  } else {
    return AutoLayoutViewerWrapper;
  }
};

/**
 * getAutoLayoutSystem
 *
 * utility function to return the auto layout system config for
 * wrapper based on render mode and property enhancer function
 *
 * @returns
 *  @function LayoutSystemWrapper - layout and render mode specific component which is wrapped around a widget
 *  pls check getAutoLayoutSystemWrapper for more details.
 *  @function propertyEnhancer - layout specific enhancer function which adds more properties generated/used by the layout system.
 *  pls check getAutoLayoutSystemPropsEnhancer for more details.
 */

export function getAutoLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getAutoLayoutSystemWrapper(renderMode),
    propertyEnhancer: getAutoLayoutSystemPropsEnhancer,
  };
}
