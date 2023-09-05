import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorWraper } from "./editor/AutoLayoutEditorWraper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";
import { getAutoLayoutComponentDimensions } from "utils/ComponentSizeUtils";

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

const getAutoLayoutSystemProps = (props: BaseWidgetProps) => {
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

export const getAutoLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorWraper;
  } else {
    return AutoLayoutViewerWrapper;
  }
};

export function getAutoLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getAutoLayoutSystemWrapper(renderMode),
    propertyEnhancer: getAutoLayoutSystemProps,
  };
}
