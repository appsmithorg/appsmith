import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./viewer/FixedLayoutViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getFixedLayoutComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";

/**
 * getLabelWidth
 * utiltiy function to compute a widgets label width in Fixed layout system
 *
 */
const getLabelWidth = (props: BaseWidgetProps) => {
  return (Number(props.labelWidth) || 0) * props.parentColumnSpace;
};

/**
 * getFixedLayoutSystemPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Fixed Layout system specific props
 *
 */
const getFixedLayoutSystemPropsEnhancer = (props: BaseWidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  const labelComponentWidth = getLabelWidth(props);

  return {
    ...props,
    componentHeight,
    componentWidth,
    labelComponentWidth,
  };
};

/**
 * getFixedLayoutSystemWrapper
 *
 * utility function to return the fixed layout system wrapper based on render mode.
 * wrapper is the component that wraps around a widget to provide layouting ability and enable editing experience.
 *
 */
const getFixedLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return FixedLayoutEditorWrapper;
  } else {
    return FixedLayoutViewerWrapper;
  }
};

/**
 * getFixedLayoutSystem
 *
 * utility function to return the fixed layout system config for
 * wrapper based on render mode and property enhancer function
 *
 */
export function getFixedLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getFixedLayoutSystemWrapper(renderMode),
    propertyEnhancer: getFixedLayoutSystemPropsEnhancer,
  };
}
