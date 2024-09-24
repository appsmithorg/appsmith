import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./viewer/FixedLayoutViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getFixedLayoutComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";
import { FixedLayoutEditorCanvas } from "./canvas/FixedLayoutEditorCanvas";
import type { CanvasProps } from "./canvas/FixedLayoutEditorCanvas";
import { FixedLayoutViewerCanvas } from "./canvas/FixedLayoutViewerCanvas";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import type { LayoutSystem } from "layoutSystems/types";

/**
 * getLabelWidth
 * utility function to compute a widgets label width in Fixed layout system
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
const getFixedLayoutSystemWidgetPropsEnhancer = (props: BaseWidgetProps) => {
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

const defaultFixedCanvasProps: Partial<CanvasProps> = {
  parentRowSpace: 1,
  parentColumnSpace: 1,
  topRow: 0,
  leftColumn: 0,
  containerStyle: "none",
  detachFromLayout: true,
  shouldScrollContents: false,
};

/**
 * getFixedLayoutSystemCanvasPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps of canvas with Auto Layout system specific props
 *
 * @returns EnhancedBaseWidgetProps
 *  @property {number} componentHeight The calculated height of a widget in pixels.
 *  @property {number} componentWidth The calculated width of a widget in pixels.
 *
 */

const getFixedLayoutSystemCanvasPropsEnhancer = (props: BaseWidgetProps) => {
  const enhancedProps = {
    minHeight: CANVAS_DEFAULT_MIN_HEIGHT_PX,
    ...props,
    ...defaultFixedCanvasProps,
  };
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(enhancedProps);

  return {
    ...enhancedProps,
    componentHeight,
    componentWidth,
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
 *
 * utility function to return the fixed layout system canvas implementation based on render mode.
 *
 * @returns current render mode specific canvas component.
 */

function getFixedLayoutSystemCanvasWrapper(renderMode: RenderModes) {
  if (renderMode === RenderModes.CANVAS) {
    return FixedLayoutEditorCanvas;
  } else {
    return FixedLayoutViewerCanvas;
  }
}

/**
 * getFixedLayoutSystem
 *
 * utility function to return the fixed layout system config for
 * wrapper based on render mode and property enhancer function
 *
 * @returns
 *  @property widgetSystem - widget specific wrappers and enhancers of a layout system
 *  @property canvasSystem - canvas specific implementation and enhancers of a layout system
 */

export function getFixedLayoutSystem(renderMode: RenderModes): LayoutSystem {
  return {
    widgetSystem: {
      WidgetWrapper: getFixedLayoutSystemWrapper(renderMode),
      propertyEnhancer: getFixedLayoutSystemWidgetPropsEnhancer,
    },
    canvasSystem: {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Canvas: getFixedLayoutSystemCanvasWrapper(renderMode) as any,
      propertyEnhancer: getFixedLayoutSystemCanvasPropsEnhancer,
    },
  };
}
