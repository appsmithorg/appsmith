import { isFunction } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorCanvas } from "./canvas/AutoLayoutEditorCanvas";
import { AutoLayoutViewerCanvas } from "./canvas/AutoLayoutViewerCanvas";
import { AutoLayoutEditorWrapper } from "./editor/AutoLayoutEditorWrapper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";

/**
 * getAutoLayoutDimensionsConfig
 *
 * utility function to fetch and process widget specific autoDimensionConfig(specific to Auto Layout Layout system)
 * stored on the WidgetFactory.autoLayoutConfigMap.
 *
 * @returns AutoDimensionValues | undefined
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
 * utility function to compute a widgets dimensions in Auto layout system
 *
 * @returns
 *  @property {number} componentHeight The calculated height of a widget in pixels.
 *  @property {number} componentWidth The calculated width of a widget in pixels.
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

export function getAutoLayoutSystemCanvasWrapper(renderMode: RenderModes) {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorCanvas;
  } else {
    return AutoLayoutViewerCanvas;
  }
}
