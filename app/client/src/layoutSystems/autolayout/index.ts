import { isFunction } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorWraper } from "./editor/AutoLayoutEditorWraper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";
import { getAutoLayoutComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";

/**
 * getAutoLayoutDimensionsConfig
 *
 * utility function to fetch and process widget specific autoDimensionConfig(specific to Auto Layout Layout system)
 * stored on the autoLayoutConfigMap.
 *
 */
const getAutoLayoutDimensionsConfig = (props: BaseWidgetProps) => {
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  if (props.isListItemContainer && autoDimensionConfig) {
    autoDimensionConfig.height = false;
  }
  return autoDimensionConfig;
};

/**
 * getAutoLayoutSystemPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Auto Layout system specific props
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
 * wrapper is the component that wraps around a widget to provide layouting ability and enable editing experience.
 *
 */

const getAutoLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorWraper;
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
 */

export function getAutoLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getAutoLayoutSystemWrapper(renderMode),
    propertyEnhancer: getAutoLayoutSystemPropsEnhancer,
  };
}
