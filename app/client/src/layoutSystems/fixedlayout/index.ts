import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./viewer/FixedLayoutViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getFixedLayoutComponentDimensions } from "utils/ComponentSizeUtils";

const getFixedLayoutSystemProps = (props: BaseWidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  return {
    ...props,
    componentHeight,
    componentWidth,
  };
};

export const getFixedLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return FixedLayoutEditorWrapper;
  } else {
    return FixedLayoutViewerWrapper;
  }
};
export function getFixedLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getFixedLayoutSystemWrapper(renderMode),
    propertyEnhancer: getFixedLayoutSystemProps,
  };
}
