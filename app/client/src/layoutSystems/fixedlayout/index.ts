import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./viewer/FixedLayoutViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

const getFixedLayoutComponentDimensions = ({
  bottomRow,
  leftColumn,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  return {
    componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
    componentHeight: (bottomRow - topRow) * parentRowSpace,
  };
};

const getLabelWidth = (props: BaseWidgetProps) => {
  return (Number(props.labelWidth) || 0) * props.parentColumnSpace;
};

const getFixedLayoutSystemProps = (props: BaseWidgetProps) => {
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
