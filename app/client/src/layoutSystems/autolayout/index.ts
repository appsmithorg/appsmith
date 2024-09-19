import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorCanvas } from "./canvas/AutoLayoutEditorCanvas";
import { AutoLayoutViewerCanvas } from "./canvas/AutoLayoutViewerCanvas";
import { AutoLayoutEditorWrapper } from "./editor/AutoLayoutEditorWrapper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";
import { getAutoLayoutComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";
import type { LayoutSystem } from "layoutSystems/types";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import type { CanvasProps } from "layoutSystems/fixedlayout/canvas/FixedLayoutEditorCanvas";
import {
  getAutoDimensionsConfig,
  getAutoLayoutWidgetConfig,
} from "layoutSystems/common/utils/commonUtils";
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
 * getAutoLayoutSystemWidgetPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Auto Layout system specific props
 *
 * @returns EnhancedBaseWidgetProps
 *  @property {AutoDimensionValues | undefined} autoDimensionConfig The auto dimension configuration of a widget.
 *  @property {number} componentHeight The calculated height of a widget in pixels.
 *  @property {number} componentWidth The calculated width of a widget in pixels.
 *
 */

const getAutoLayoutSystemWidgetPropsEnhancer = (props: BaseWidgetProps) => {
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

const defaultAutoLayoutCanvasProps: Partial<CanvasProps> = {
  parentRowSpace: 1,
  parentColumnSpace: 1,
  topRow: 0,
  leftColumn: 0,
  containerStyle: "none",
  detachFromLayout: true,
  shouldScrollContents: false,
};

/**
 * getAutoLayoutSystemCanvasPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps of canvas with Auto Layout system specific props
 *
 * @returns EnhancedBaseWidgetProps
 *  @property {AutoDimensionValues | undefined} autoDimensionConfig The auto dimension configuration of a widget.
 *  @property {number} componentHeight The calculated height of a widget in pixels.
 *  @property {number} componentWidth The calculated width of a widget in pixels.
 *
 */

const getAutoLayoutSystemCanvasPropsEnhancer = (props: BaseWidgetProps) => {
  const enhancedProps = {
    minHeight: CANVAS_DEFAULT_MIN_HEIGHT_PX,
    ...props,
    ...defaultAutoLayoutCanvasProps,
  };
  const autoDimensionConfig = getAutoLayoutDimensionsConfig(enhancedProps);
  const { componentHeight, componentWidth } =
    getAutoLayoutComponentDimensions(enhancedProps);

  return {
    ...enhancedProps,
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
 * getAutoLayoutSystemCanvasWrapper
 *
 * utility function to return the auto layout system canvas implementation based on render mode.
 *
 * @returns current render mode specific canvas component.
 */

function getAutoLayoutSystemCanvasWrapper(renderMode: RenderModes) {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorCanvas;
  } else {
    return AutoLayoutViewerCanvas;
  }
}

/**
 * getAutoLayoutSystem
 *
 * utility function to return the auto layout system config for
 * wrapper based on render mode and property enhancer function
 *
 * @returns
 *  @property widgetSystem - widget specific wrappers and enhancers of a layout system
 *  @property canvasSystem - canvas specific implementation and enhancers of a layout system
 */

export function getAutoLayoutSystem(renderMode: RenderModes): LayoutSystem {
  return {
    widgetSystem: {
      WidgetWrapper: getAutoLayoutSystemWrapper(renderMode),
      propertyEnhancer: getAutoLayoutSystemWidgetPropsEnhancer,
    },
    canvasSystem: {
      Canvas: getAutoLayoutSystemCanvasWrapper(renderMode),
      propertyEnhancer: getAutoLayoutSystemCanvasPropsEnhancer,
    },
  };
}
