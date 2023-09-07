import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorWraper } from "./editor/AutoLayoutEditorWraper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";

/**
 * getAutoLayoutDimensionsConfig
 *
 * utiltiy function to fetch and process widget specific autoDimensionConfig(specific to Auto Layout Layout system)
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
 * getAutoLayoutComponentDimensions
 *
 * utiltiy function to compute a widgets dimensions in Auto layout system
 *
 */

const getAutoLayoutComponentDimensions = ({
  bottomRow,
  isFlexChild,
  isMobile,
  leftColumn,
  mobileBottomRow,
  mobileLeftColumn,
  mobileRightColumn,
  mobileTopRow,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  let left = leftColumn;
  let right = rightColumn;
  let top = topRow;
  let bottom = bottomRow;
  if (isFlexChild && isMobile) {
    if (mobileLeftColumn !== undefined && parentColumnSpace !== 1) {
      left = mobileLeftColumn;
    }
    if (mobileRightColumn !== undefined && parentColumnSpace !== 1) {
      right = mobileRightColumn;
    }
    if (mobileTopRow !== undefined && parentRowSpace !== 1) {
      top = mobileTopRow;
    }
    if (mobileBottomRow !== undefined && parentRowSpace !== 1) {
      bottom = mobileBottomRow;
    }
  }

  return {
    componentWidth: (right - left) * parentColumnSpace,
    componentHeight: (bottom - top) * parentRowSpace,
  };
};

/**
 * getAutoLayoutSystemPropsEnhancer
 *
 * utiltiy function to enhance BaseWidgetProps with Auto Layout system specific props
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
 * utiltiy function to return the auto layout system wrapper based on render mode.
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
 * utiltiy function to return the auto layout system config for
 * wrapper based on render mode and property enhancer funciton
 *
 */

export function getAutoLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getAutoLayoutSystemWrapper(renderMode),
    propertyEnhancer: getAutoLayoutSystemPropsEnhancer,
  };
}
